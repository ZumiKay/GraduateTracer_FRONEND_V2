import { Button, Tab, Tabs } from "@heroui/react";
import { FiCheckCircle, FiUser, FiUsers, FiGrid } from "react-icons/fi";
import FilterSection from "../component/Filter/FilterSection";
import FormPagination from "../component/FormComponent/Pagination";
import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../redux/openmodal";
import { RootState } from "../redux/store";
import CreateForm from "../component/Modal/Form.modal";
import { createQueryFn, createMutationFn } from "../hooks/ApiHook";
import { setallformstate } from "../redux/formstore";
import { FormDataType } from "../types/Form.types";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import { CardLoading } from "../component/Loading/ContainerLoading";
import { useNavigate, useSearchParams } from "react-router";
import FormCard from "../component/Card/FormCard";
import FilledFormCard from "../component/Card/FilledFormCard";
import CreateCardBtn from "../component/Card/CreateCardBtn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardFilterType, DashboardTabType } from "../types/Global.types";

const HeaderSection = memo(
  ({
    isManage,
    selectedCard,
    onManageToggle,
    onDeletePress,
    isDeleting,
    filterState,
    setfilterState,
  }: {
    isManage: boolean;
    selectedCard: Set<string>;
    onManageToggle: () => void;
    onDeletePress: () => void;
    isDeleting?: boolean;
    filterState: DashboardFilterType;
    setfilterState: React.Dispatch<React.SetStateAction<DashboardFilterType>>;
  }) => (
    <div className="header_section h-fit flex flex-row justify-between items-center gap-x-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
      <FilterSection
        Filterstate={filterState}
        setFilterstate={setfilterState}
      />
      <div className="flex gap-x-3">
        <Button
          variant="flat"
          className={`font-bold text-white transition-all duration-200 ${
            isManage
              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
          }`}
          onPress={onManageToggle}
          isDisabled={isDeleting}
        >
          {isManage ? "Cancel" : "Manage"}
        </Button>
        {isManage && selectedCard.size > 0 && (
          <Button
            variant="flat"
            className="font-bold text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-200"
            onPress={onDeletePress}
            isLoading={isDeleting}
            isDisabled={isDeleting}
          >
            Delete {selectedCard.size}
          </Button>
        )}
      </div>
    </div>
  )
);

const FormGrid = memo(
  ({
    loading,
    allformstate,
    isManage,
    selectedCard,
    onCardClick,
    onCreateClick,
    tab,
  }: {
    loading: boolean;
    allformstate: FormDataType[];
    isManage: boolean;
    selectedCard: Set<string>;
    onCardClick: (id: string) => void;
    onCreateClick: () => void;
    tab: DashboardTabType;
  }) => (
    <div className="formcontainer w-full h-fit grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
      {tab !== DashboardTabType.filledform && (
        <CreateCardBtn onClick={onCreateClick} />
      )}
      {loading
        ? Array.from({ length: 3 }).map((_, idx) => (
            <CardLoading key={`loading-${idx}`} />
          ))
        : allformstate?.map(
            (form) =>
              form._id &&
              (form.isFilled ? (
                <FilledFormCard
                  key={`form-${form._id}`}
                  data={form}
                  isManage={isManage}
                  onClick={() => onCardClick(form._id ?? "")}
                  isSelect={selectedCard.has(form._id)}
                />
              ) : (
                <FormCard
                  key={`form-${form._id}`}
                  data={form}
                  type={form.type as never}
                  isManage={isManage}
                  onClick={() => onCardClick(form._id ?? "")}
                  isSelect={selectedCard.has(form._id)}
                />
              ))
          )}
    </div>
  )
);

const FormTypeSelect = ({
  tab,
  settab,
}: {
  tab: DashboardTabType;
  settab: React.Dispatch<React.SetStateAction<DashboardTabType>>;
}) => {
  return (
    <div className="w-full h-fit flex flex-wrap gap-4">
      <Tabs
        aria-label="Tabs variants"
        variant="solid"
        size="lg"
        selectedKey={tab}
        onSelectionChange={settab as never}
      >
        <Tab
          key={DashboardTabType.all}
          title={
            <div className="flex items-center gap-2">
              <FiGrid />
              <span>All Forms</span>
            </div>
          }
        />
        <Tab
          key={DashboardTabType.filledform}
          title={
            <div className="flex items-center gap-2">
              <FiCheckCircle />
              <span>Filled Form</span>
            </div>
          }
        />
        <Tab
          key={DashboardTabType.myform}
          title={
            <div className="flex items-center gap-2">
              <FiUser />
              <span>My Form</span>
            </div>
          }
        />
        <Tab
          key={DashboardTabType.otherform}
          title={
            <div className="flex items-center gap-2">
              <FiUsers />
              <span>Other Form</span>
            </div>
          }
        />
      </Tabs>
    </div>
  );
};

function Dashboard() {
  const [isManage, setisManage] = useState(false);
  const [selectedcard, setselectedcard] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<DashboardTabType>(DashboardTabType.all);
  const dispatch = useDispatch();
  const selector = useSelector((state: RootState) => state.openmodal);
  const { allformstate } = useSelector((state: RootState) => state.allform);
  const [searchParam, setSearchParam] = useSearchParams();
  const [page, setpage] = useState(Number(searchParam.get("page")) || 1);
  const [limit, setlimit] = useState(Number(searchParam.get("show")) || 5);
  const [Filterstate, setFilterstate] = useState<DashboardFilterType>({
    q: searchParam.get("q") ?? undefined,
    created: searchParam.get("created") ?? undefined,
    updated: searchParam.get("updated") ?? undefined,
  });
  const [paginationData, setPaginationData] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const queryParam = useMemo(
    () =>
      new URLSearchParams({
        ty: "user",
        page: page.toString() ?? "1",
        limit: limit.toString() ?? "5",
        tab: tab,
        ...(Filterstate.q && { q: Filterstate.q.trim().toLowerCase() }),
        ...(Filterstate.created && { created: Filterstate.created }),
        ...(Filterstate.updated && { updated: Filterstate.updated }),
      }),
    [Filterstate.created, Filterstate.q, Filterstate.updated, limit, page, tab]
  );

  const {
    data: formsResponse,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["forms", tab, page, limit, Filterstate],
    queryFn: createQueryFn({
      url: `/filteredform?${queryParam}`,
      method: "GET",
      cookie: true,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const deleteFormsMutation = useMutation({
    mutationFn: createMutationFn({
      url: "/deleteform",
      method: "DELETE",
      cookie: true,
    }),
    onSuccess: () => {
      SuccessToast({
        title: "Success",
        content: "Forms deleted successfully",
        toastid: "delete-forms",
      });

      dispatch(
        setallformstate(
          allformstate.filter((form) => !selectedcard.has(form._id ?? ""))
        )
      );
      setselectedcard(new Set());
      setisManage(false);

      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Failed",
        content: error.message || "Can't Delete Forms",
        toastid: "Delete Forms",
      });
    },
  });

  const handleManageCardSelection = useCallback(
    (id: string) => {
      if (isManage) {
        setselectedcard((prev) => {
          const newset = new Set(prev);
          if (newset.has(id)) {
            newset.delete(id);
          } else {
            newset.add(id);
          }
          return newset;
        });
      } else {
        // Find the form data to check if it's filled
        const form = allformstate.find((f) => f._id === id);
        if (form?.isFilled) {
          // Navigate to filled form view to show questions, responses, scores and feedback
          navigate(`/filled-form/${id}`);
        } else {
          // Navigate to form editor
          navigate(`/form/${id}`);
        }
      }
    },
    [isManage, navigate, allformstate]
  );

  const handleManageToggle = useCallback(() => {
    setisManage((prev) => {
      if (prev) {
        setselectedcard(new Set());
      }
      return !prev;
    });
  }, []);

  const handleCreateFormClick = useCallback(() => {
    dispatch(
      OpenModal.actions.setopenmodal({
        state: "createform",
        value: true,
      })
    );
  }, [dispatch]);

  useEffect(() => {
    const urlPage = Number(searchParam.get("page")) || 1;
    const urlLimit = Number(searchParam.get("show")) || 5;

    if (urlPage !== page) {
      setpage(urlPage);
    }
    if (urlLimit !== limit) {
      setlimit(urlLimit);
    }
  }, [searchParam, page, limit]);

  useEffect(() => {
    if (formsResponse) {
      const responseData = formsResponse as {
        data: {
          userForms: Array<FormDataType>;
        };
        pagination?: {
          totalPages: number;
          totalCount: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      };

      dispatch(
        setallformstate(responseData.data.userForms ?? responseData.data ?? [])
      );

      if (responseData.pagination) {
        setPaginationData({
          totalPages: responseData.pagination.totalPages,
          totalCount: responseData.pagination.totalCount,
          hasNextPage: responseData.pagination.hasNextPage,
          hasPrevPage: responseData.pagination.hasPrevPage,
        });
      }
    }
  }, [formsResponse, dispatch]);

  useEffect(() => {
    if (fetchError) {
      ErrorToast({
        title: "Failed To Fetch",
        content: "Error Connection",
        toastid: "Error Connection",
      });
    }
  }, [fetchError]);

  // Verify search parameters - remove conflicting created and updated params
  useEffect(() => {
    const createdParam = searchParam.get("created");
    const updatedParam = searchParam.get("updated");
    const validValues = [1, -1];

    let needsUpdate = false;
    const newParams = new URLSearchParams(searchParam);
    const filterUpdates: Partial<DashboardFilterType> = {};

    // Check if both parameters exist (conflict resolution)
    if (createdParam && updatedParam) {
      newParams.delete("created");
      newParams.delete("updated");
      filterUpdates.created = undefined;
      filterUpdates.updated = undefined;
      needsUpdate = true;
    } else {
      // Validate individual parameters
      if (createdParam && !validValues.includes(parseInt(createdParam))) {
        newParams.delete("created");
        filterUpdates.created = undefined;
        needsUpdate = true;
      }

      if (updatedParam && !validValues.includes(parseInt(updatedParam))) {
        newParams.delete("updated");
        filterUpdates.updated = undefined;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setSearchParam(newParams);
      if (Object.keys(filterUpdates).length > 0) {
        setFilterstate((prev) => ({ ...prev, ...filterUpdates }));
      }
    }
  }, [searchParam, setSearchParam]);

  // Verify page and show parameters - remove if wrong format
  useEffect(() => {
    const pageParam = searchParam.get("page");
    const showParam = searchParam.get("show");
    let needsUpdate = false;
    const newParams = new URLSearchParams(searchParam);

    // Check page parameter
    if (pageParam !== null) {
      const pageNumber = Number(pageParam);
      if (
        isNaN(pageNumber) ||
        pageNumber < 1 ||
        !Number.isInteger(pageNumber)
      ) {
        newParams.delete("page");
        needsUpdate = true;
        setpage(1); // Reset to default
      }
    }

    // Check show parameter
    if (showParam !== null) {
      const showNumber = Number(showParam);
      if (
        isNaN(showNumber) ||
        showNumber < 1 ||
        !Number.isInteger(showNumber)
      ) {
        newParams.delete("show");
        needsUpdate = true;
        setlimit(5); // Reset to default
      }
    }

    if (needsUpdate) {
      setSearchParam(newParams);
    }
  }, [searchParam, setSearchParam]);

  const handleDeleteForm = useCallback(async () => {
    if (selectedcard.size === 0) return;

    try {
      await deleteFormsMutation.mutateAsync({
        ids: Array.from(selectedcard),
      });
    } catch (error) {
      console.error("Delete forms error:", error);
    }
  }, [selectedcard, deleteFormsMutation]);

  const handleDeletePress = useCallback(() => {
    dispatch(
      OpenModal.actions.setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: {
            onAgree: handleDeleteForm,
          },
        },
      })
    );
  }, [dispatch, handleDeleteForm]);

  const handleCreateFormModalClose = useCallback(() => {
    dispatch(
      OpenModal.actions.setopenmodal({
        state: "createform",
        value: false,
      })
    );
  }, [dispatch]);

  return (
    <>
      {selector.createform && (
        <CreateForm
          open={selector.createform}
          setopen={handleCreateFormModalClose}
        />
      )}

      <div className="w-full p-6 h-full flex flex-col gap-y-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <HeaderSection
          isManage={isManage}
          filterState={Filterstate}
          setfilterState={setFilterstate}
          selectedCard={selectedcard}
          onManageToggle={handleManageToggle}
          onDeletePress={handleDeletePress}
          isDeleting={deleteFormsMutation.isPending}
        />

        <FormTypeSelect tab={tab} settab={setTab} />

        <FormGrid
          loading={isLoading || deleteFormsMutation.isPending}
          allformstate={allformstate}
          isManage={isManage}
          selectedCard={selectedcard}
          onCardClick={handleManageCardSelection}
          onCreateClick={handleCreateFormClick}
          tab={tab}
        />

        <div className="mt-auto flex justify-center">
          <FormPagination
            onPageChange={setpage}
            onLimitChange={setlimit}
            total={paginationData.totalPages}
            totalCount={paginationData.totalCount}
            currentItems={allformstate.length}
          />
        </div>
      </div>
    </>
  );
}

Dashboard.displayName = "Dashboard";

export default memo(Dashboard);

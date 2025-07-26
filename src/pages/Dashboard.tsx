/**
 * Dashboard Component - Converted to React Query
 *
 * Features:
 * - Uses React Query for data fetching with automatic caching and refetching
 * - Optimistic updates for delete operations
 * - Proper loading states and error handling
 * - Automatic query invalidation after mutations
 * - Stale-while-revalidate pattern for better UX
 */

import { Button } from "@heroui/react";
import FilterSection from "../component/Filter/FilterSection";
import FormPagination from "../component/FormComponent/Pagination";
import { useEffect, useState, useCallback, memo } from "react";
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
import CreateCardBtn from "../component/Card/CreateCardBtn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Memoized header section component
const HeaderSection = memo(
  ({
    isManage,
    selectedCard,
    onManageToggle,
    onDeletePress,
    isDeleting,
  }: {
    isManage: boolean;
    selectedCard: Set<string>;
    onManageToggle: () => void;
    onDeletePress: () => void;
    isDeleting?: boolean;
  }) => (
    <div className="header_section h-fit flex flex-row justify-between items-center gap-x-4 bg-white p-4 rounded-lg shadow-sm border">
      <FilterSection />
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

// Memoized form grid component
const FormGrid = memo(
  ({
    loading,
    allformstate,
    isManage,
    selectedCard,
    onCardClick,
    onCreateClick,
  }: {
    loading: boolean;
    allformstate: FormDataType[];
    isManage: boolean;
    selectedCard: Set<string>;
    onCardClick: (id: string) => void;
    onCreateClick: () => void;
  }) => (
    <div className="formcontainer w-full h-fit grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
      <CreateCardBtn onClick={onCreateClick} />
      {loading
        ? Array.from({ length: 3 }).map((_, idx) => (
            <CardLoading key={`loading-${idx}`} />
          ))
        : allformstate.map(
            (form) =>
              form._id && (
                <FormCard
                  key={`form-${form._id}`}
                  data={form}
                  type={form.type as never}
                  isManage={isManage}
                  onClick={() => onCardClick(form._id ?? "")}
                  isSelect={selectedCard.has(form._id)}
                />
              )
          )}
    </div>
  )
);

function Dashboard() {
  const [isManage, setisManage] = useState(false);
  const [selectedcard, setselectedcard] = useState<Set<string>>(new Set());
  const dispatch = useDispatch();
  const selector = useSelector((state: RootState) => state.openmodal);
  const { allformstate } = useSelector((state: RootState) => state.allform);
  const [searchParam] = useSearchParams();
  const [page, setpage] = useState(Number(searchParam.get("page")) || 1);
  const [limit, setlimit] = useState(Number(searchParam.get("show")) || 5);
  const [paginationData, setPaginationData] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch forms using React Query
  const {
    data: formsResponse,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["forms", page, limit],
    queryFn: createQueryFn({
      url: `/filteredform?ty=user&page=${page}&limit=${limit}`,
      method: "GET",
      cookie: true,
      refreshtoken: true,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Delete forms mutation
  const deleteFormsMutation = useMutation({
    mutationFn: createMutationFn({
      url: "/deleteform",
      method: "DELETE",
      cookie: true,
      refreshtoken: true,
    }),
    onSuccess: () => {
      SuccessToast({
        title: "Success",
        content: "Forms deleted successfully",
        toastid: "delete-forms",
      });

      // Update local state immediately for optimistic UI

      dispatch(
        setallformstate(
          allformstate.filter((form) => !selectedcard.has(form._id ?? ""))
        )
      );
      setselectedcard(new Set());
      setisManage(false);

      // Invalidate and refetch forms
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

  // Memoized callback for card selection
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
        navigate(`/form/${id}`, { replace: true });
      }
    },
    [isManage, navigate]
  );

  // Memoized callback for manage toggle
  const handleManageToggle = useCallback(() => {
    setisManage((prev) => {
      if (prev) {
        setselectedcard(new Set());
      }
      return !prev;
    });
  }, []);

  // Memoized callback for create form
  const handleCreateFormClick = useCallback(() => {
    dispatch(
      OpenModal.actions.setopenmodal({
        state: "createform",
        value: true,
      })
    );
  }, [dispatch]);

  // Sync URL parameters with state
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

  // Update Redux state and pagination when forms data changes
  useEffect(() => {
    if (formsResponse) {
      const responseData = formsResponse as {
        data: Array<FormDataType>;
        pagination?: {
          totalPages: number;
          totalCount: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      };

      dispatch(setallformstate(responseData.data ?? []));

      // Update pagination data from response
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

  // Handle fetch error
  useEffect(() => {
    if (fetchError) {
      ErrorToast({
        title: "Failed To Fetch",
        content: "Error Connection",
        toastid: "Error Connection",
      });
    }
  }, [fetchError]);

  const handleDeleteForm = useCallback(async () => {
    if (selectedcard.size === 0) return;

    try {
      await deleteFormsMutation.mutateAsync({
        ids: Array.from(selectedcard),
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Delete forms error:", error);
    }
  }, [selectedcard, deleteFormsMutation]);

  // Memoized delete press handler
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

  // Memoized create form modal handler
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

      <div className="w-full p-6 h-full flex flex-col gap-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <HeaderSection
          isManage={isManage}
          selectedCard={selectedcard}
          onManageToggle={handleManageToggle}
          onDeletePress={handleDeletePress}
          isDeleting={deleteFormsMutation.isPending}
        />

        <FormGrid
          loading={isLoading || deleteFormsMutation.isPending}
          allformstate={allformstate}
          isManage={isManage}
          selectedCard={selectedcard}
          onCardClick={handleManageCardSelection}
          onCreateClick={handleCreateFormClick}
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

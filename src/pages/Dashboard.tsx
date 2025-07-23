import { Button } from "@heroui/react";
import FilterSection from "../component/Filter/FilterSection";
import FormPagination from "../component/FormComponent/Pagination";
import { useEffect, useState, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../redux/openmodal";
import { RootState } from "../redux/store";
import CreateForm from "../component/Modal/Form.modal";
import ApiRequest from "../hooks/ApiHook";
import { setallformstate } from "../redux/formstore";
import { FormDataType } from "../types/Form.types";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import { CardLoading } from "../component/Loading/ContainerLoading";
import { useNavigate, useSearchParams } from "react-router";
import FormCard from "../component/Card/FormCard";
import CreateCardBtn from "../component/Card/CreateCardBtn";

// Memoized header section component
const HeaderSection = memo(
  ({
    isManage,
    selectedCard,
    onManageToggle,
    onDeletePress,
  }: {
    isManage: boolean;
    selectedCard: Set<string>;
    onManageToggle: () => void;
    onDeletePress: () => void;
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
        >
          {isManage ? "Cancel" : "Manage"}
        </Button>
        {isManage && selectedCard.size > 0 && (
          <Button
            variant="flat"
            className="font-bold text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-200"
            onPress={onDeletePress}
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
  const [loading, setloading] = useState(false);
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

  // Memoized fetch function
  const fetchForms = useCallback(async () => {
    setloading(true);
    try {
      const response = await ApiRequest({
        url: `/filteredform?ty=user&page=${page}&limit=${limit}`,
        method: "GET",
        cookie: true,
        refreshtoken: true,
      });

      if (!response.success) {
        ErrorToast({
          title: "Failed To Fetch",
          content: "Error Connection",
          toastid: "Error Connection",
        });
        return;
      }

      dispatch(setallformstate((response.data as Array<FormDataType>) ?? []));

      // Update pagination data from response
      if (response.pagination) {
        setPaginationData({
          totalPages: response.pagination.totalPages,
          totalCount: response.pagination.totalCount,
          hasNextPage: response.pagination.hasNextPage,
          hasPrevPage: response.pagination.hasPrevPage,
        });
      }
    } finally {
      setloading(false);
    }
  }, [dispatch, page, limit]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleDeleteForm = useCallback(async () => {
    setloading(true);
    try {
      const response = await ApiRequest({
        url: "/deleteform",
        method: "DELETE",
        cookie: true,
        refreshtoken: true,
        data: { ids: Array.from(selectedcard) },
      });

      if (!response.success) {
        ErrorToast({
          title: "Failed",
          content: "Can't Delete Form",
          toastid: "Delete Form",
        });
        return;
      }

      dispatch(
        setallformstate(
          allformstate.length === 0
            ? []
            : allformstate.filter((form) => !selectedcard.has(form._id ?? ""))
        )
      );
      setselectedcard(new Set());
      SuccessToast({ title: "Success", content: "Form Deleted" });
    } finally {
      setloading(false);
    }
  }, [selectedcard, allformstate, dispatch]);

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
        />

        <FormGrid
          loading={loading}
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

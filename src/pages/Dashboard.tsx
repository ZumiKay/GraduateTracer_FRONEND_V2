import { Button } from "@nextui-org/react";
import Card, { CreateCardBtn } from "../component/Card/Card";
import FilterSection from "../component/Filter/FilterSection";
import FormPagination from "../component/FormComponent/Pagination";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../redux/openmodal";
import { RootState } from "../redux/store";
import CreateForm from "../component/Modal/Form.modal";
import ApiRequest from "../hooks/ApiHook";
import { setallformstate } from "../redux/formstore";
import { FormDataType } from "../types/Form.types";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import { CardLoading } from "../component/Loading/ContainerLoading";
import { useNavigate } from "react-router";

function Dashboard() {
  const [isManage, setisManage] = useState(false);
  const [selectedcard, setselectedcard] = useState<Set<string>>(new Set());
  const dispatch = useDispatch();
  const selector = useSelector((state: RootState) => state.openmodal);
  const { allformstate } = useSelector((state: RootState) => state.allform);
  const [loading, setloading] = useState(false);
  const [page, setpage] = useState(1);
  const [limit, setlimit] = useState(5);
  const navigate = useNavigate();

  const handleManageCardSelection = (id: string) => {
    if (isManage) {
      const newset = new Set<string>(selectedcard);
      if (newset.has(id)) {
        newset.delete(id);
      } else newset.add(id);
      setselectedcard(newset);
    } else {
      navigate(`/form/${id}`, { replace: true });
    }
  };

  useEffect(() => {
    const fetchForm = async () => {
      setloading(true);
      const response = await ApiRequest({
        url: `/filteredform?ty=user&page=${page}&limit=${limit}`,
        method: "GET",
        cookie: true,
        refreshtoken: true,
      });
      setloading(false);
      if (!response.success) {
        ErrorToast({
          title: "Failed To Fetch",
          content: "Error Connection",
          toastid: "Error Connection",
        });
        return;
      }
      dispatch(setallformstate((response.data as Array<FormDataType>) ?? []));
    };
    fetchForm();
  }, []);

  const handleDeleteForm = async () => {
    setloading(true);
    const response = await ApiRequest({
      url: "/deleteform",
      method: "DELETE",
      cookie: true,
      refreshtoken: true,
      data: { ids: Array.from(selectedcard) },
    });
    setloading(false);

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
    SuccessToast({ title: "Sucess", content: "Form Deleted" });
  };

  return (
    <>
      {selector.createform && (
        <CreateForm
          open={selector.createform}
          setopen={() =>
            dispatch(
              OpenModal.actions.setopenmodal({
                state: "createform",
                value: false,
              })
            )
          }
        />
      )}

      <div className="w-full p-2 h-full flex flex-col gap-y-10">
        <div className="header_section h-fit flex flex-row justify-between items-center gap-x-3">
          <FilterSection />
          <Button
            variant="flat"
            className={`max-w-sm font-bold text-white ${
              isManage ? "bg-danger" : "bg-primary"
            }`}
            onPress={() =>
              setisManage((prev) => {
                if (prev) {
                  setselectedcard(new Set());
                }
                return !prev;
              })
            }
          >
            {isManage ? "Cancel" : "Manage"}
          </Button>
          {isManage && selectedcard.size > 0 && (
            <Button
              variant="flat"
              className={`max-w-sm font-bold text-white bg-slate-400`}
              onPress={() => {
                dispatch(
                  OpenModal.actions.setopenmodal({
                    state: "confirm",
                    value: {
                      open: true,
                      data: {
                        onAgree: () => handleDeleteForm(),
                      },
                    },
                  })
                );
              }}
            >
              Delete {selectedcard.size}
            </Button>
          )}
        </div>

        <div className="formcontainer w-full h-fit flex flex-row gap-x-10 gap-y-5 flex-wrap items-center">
          <CreateCardBtn
            onClick={() =>
              dispatch(
                OpenModal.actions.setopenmodal({
                  state: "createform",
                  value: true,
                })
              )
            }
          />
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <CardLoading key={idx} />
              ))
            : allformstate.map(
                (form, idx) =>
                  form._id && (
                    <Card
                      key={idx}
                      data={form}
                      type={form.type as never}
                      isManage={isManage}
                      onClick={() => handleManageCardSelection(form._id ?? "")}
                      isSelect={selectedcard.has(form._id)}
                    />
                  )
              )}
        </div>
        <FormPagination
          onPageChange={setpage}
          onLimitChange={setlimit}
          total={allformstate.length === 0 ? 1 : allformstate.length}
        />
      </div>
    </>
  );
}

export default Dashboard;

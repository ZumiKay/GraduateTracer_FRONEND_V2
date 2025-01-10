import { Button } from "@nextui-org/react";
import Card, { CreateCardBtn } from "../component/Card/Card";
import FilterSection from "../component/Filter/FilterSection";
import FormPagination from "../component/FormComponent/Pagination";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import OpenModal from "../redux/openmodal";
import { RootState } from "../redux/store";
import CreateForm from "../component/Modal/Form.modal";

function Dashboard() {
  const [isManage, setisManage] = useState(false);
  const [selectedcard, setselectedcard] = useState<Set<number>>(new Set());
  const dispatch = useDispatch();
  const selector = useSelector((state: RootState) => state.openmodal);

  const handleManageCardSelection = (idx: number) => {
    const newset = new Set<number>(selectedcard);
    if (newset.has(idx)) {
      newset.delete(idx);
    } else newset.add(idx);
    setselectedcard(newset);
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
              onPress={() => setisManage((prev) => !prev)}
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
          {Array.from({ length: 5 }).map((_, idx) => (
            <Card
              type="quiz"
              isManage={isManage}
              onClick={() => handleManageCardSelection(idx)}
              isSelect={selectedcard.has(idx)}
            />
          ))}
          {Array.from({ length: 5 }).map(() => (
            <Card type="normal" isManage={isManage} />
          ))}
        </div>
        <FormPagination />
      </div>
    </>
  );
}

export default Dashboard;

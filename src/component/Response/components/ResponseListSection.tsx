import React from "react";
import { Card, CardHeader, CardBody, Pagination } from "@heroui/react";
import ResponseTable from "./ResponseTable";
import { FormDataType } from "../../../types/Form.types";
import {
  ResponseListItem,
  GroupResponseListItemType,
} from "../../../services/responseService";
import { statusColor } from "../Response.type";

type TableViewMode = "normal" | "grouped";

interface ResponseListSectionProps {
  responseList: ResponseListItem[] | GroupResponseListItemType[] | undefined;
  isLoading: boolean;
  isQuizForm: boolean;
  formId: string;
  form: FormDataType;
  tableViewMode: TableViewMode;
  onTableViewModeChange: (mode: TableViewMode) => void;
  onEditScore: (response: ResponseListItem) => void;
  onDeleteResponse: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  getStatusColor: (status: string) => statusColor;
  pagination?: {
    totalPages: number;
    totalCount: number;
  } | null;
  currentPage: number;
  limit: number;
  handlePageChange: (page: number) => void;
}

export const ResponseListSection: React.FC<ResponseListSectionProps> = ({
  responseList,
  isLoading,
  isQuizForm,
  formId,
  form,
  tableViewMode,
  onTableViewModeChange,
  onEditScore,
  onDeleteResponse,
  onBulkDelete,
  getStatusColor,
  pagination,
  currentPage,
  limit,
  handlePageChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">
          Responses ({responseList?.length ?? 0})
        </h3>
      </CardHeader>
      <CardBody>
        <ResponseTable
          responses={responseList ?? []}
          isLoading={isLoading}
          isQuizForm={isQuizForm}
          formId={formId}
          viewMode={tableViewMode}
          onViewModeChange={onTableViewModeChange}
          showGroupToggle={form?.setting?.email === true}
          onEditScore={onEditScore}
          onDeleteResponse={onDeleteResponse}
          onBulkDelete={onBulkDelete}
          getStatusColor={getStatusColor}
        />

        {pagination && (
          <div className="mt-6 space-y-4">
            {/* Pagination Info */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} responses
              </div>
              <div>
                Page {currentPage} of {pagination.totalPages}
              </div>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  total={pagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  showControls
                  size="lg"
                  className="gap-2"
                />
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

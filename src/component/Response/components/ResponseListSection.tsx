import React from "react";
import { Card, CardHeader, CardBody, Pagination, Select, SelectItem } from "@heroui/react";
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
  form?: FormDataType;
  tableViewMode: TableViewMode;
  onTableViewModeChange: (mode: TableViewMode) => void;
  onEditScore: (response: ResponseListItem) => void;
  onDeleteResponse: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBatchUpdateScores?: (selectedIds: string[], newScore: number) => void;
  isBatchUpdatingScores?: boolean;
  getStatusColor: (status: string) => statusColor;
  pagination?: {
    totalPages: number;
    totalCount: number;
  } | null;
  currentPage: number;
  limit: number;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
}

export const ResponseListSection: React.FC<ResponseListSectionProps> = ({
  responseList,
  isLoading,
  isQuizForm,
  formId,
  tableViewMode,
  onTableViewModeChange,
  onEditScore,
  onDeleteResponse,
  onBulkDelete,
  onBatchUpdateScores,
  isBatchUpdatingScores,
  getStatusColor,
  pagination,
  currentPage,
  limit,
  handlePageChange,
  handleLimitChange,
}) => {
  return (
    <Card className="w-full shadow-xs border border-gray-100 dark:border-gray-700/60 overflow-hidden">
      <CardHeader className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Responses ({responseList?.length ?? 0})
        </h3>
      </CardHeader>
      <CardBody className="p-2 sm:p-4 md:p-6 overflow-hidden">
        <ResponseTable
          responses={responseList ?? []}
          isLoading={isLoading}
          isQuizForm={isQuizForm}
          formId={formId}
          viewMode={tableViewMode}
          onViewModeChange={onTableViewModeChange}
          onEditScore={onEditScore}
          onDeleteResponse={onDeleteResponse}
          onBulkDelete={onBulkDelete}
          onBatchUpdateScores={onBatchUpdateScores}
          isBatchUpdatingScores={isBatchUpdatingScores}
          getStatusColor={getStatusColor}
          currentPage={currentPage}
          limit={limit}
        />

        {pagination && (
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700/60">
            {/* Pagination Info + Per-page selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} responses
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Rows per page
                </span>
                <Select
                  size="sm"
                  selectedKeys={[limit.toString()]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    if (selected) handleLimitChange(parseInt(selected));
                  }}
                  className="w-20"
                  aria-label="Rows per page"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <SelectItem key={n.toString()}>{n.toString()}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center w-full overflow-x-auto scrollbar-none py-1">
                <Pagination
                  total={pagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  showControls
                  size="sm"
                  className="gap-1 sm:hidden"
                />
                <Pagination
                  total={pagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  showControls
                  size="md"
                  className="gap-2 hidden sm:flex"
                />
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

import React, { Fragment, useState, forwardRef, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "animate.css/animate.css";
import "@styles/base/plugins/extensions/ext-component-sweet-alerts.scss";
import ReactPaginate from "react-paginate";
import {
  ChevronDown,
} from "react-feather";

import DataTable from "react-data-table-component";
import {
  Row,
  Col,
  Card,
  Input,
  Spinner,
} from "reactstrap";
import toast from "react-hot-toast";

import { useGetLogsQuery } from "../../slices/logsApislice";
import { useNavigate } from "react-router-dom";

const MySwal = withReactContent(Swal);

const LogsTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const {
    data: logsData = [],
    isLoading,
    refetch,
  } = useGetLogsQuery({
    page: currentPage,
    limit: itemsPerPage,
  });
  const logs = logsData.logs;
  const totalCount = logsData.total;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [selectedLog, setSelectedLog] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [filteredData, setFilteredData] = useState([]);


  useEffect(() => {
    refetch();
  }, [refetch]);

  const columns = [
    {
      name: "S.No",
      selector: (row, index) => (currentPage - 1) * itemsPerPage + index + 1,
      sortable: false,
      width: "80px",
    },
    {
      name: "User Name",
      selector: (row) => row.user.userName,
      sortable: true,
    },
    {
      name: "Action",
      selector: (row) => row.action,
      sortable: true,
    },
    {
      name: "Module",
      selector: (row) => row.module,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => new Date(row.updatedAt).toLocaleDateString("en-GB"),
      sortable: true,
    },
  ];

  const handleFilter = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value);

    const updatedData = logs.filter((item) =>
      Object.values(item).some((field) =>
        field.toString().toLowerCase().includes(value)
      )
    );

    setFilteredData(updatedData);
  };

  const handlePagination = (page) => {
    setCurrentPage(page.selected + 1);
  };

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel=""
      nextLabel=""
      forcePage={currentPage - 1}
      onPageChange={handlePagination}
      pageCount={
        searchValue.length
          ? Math.ceil(filteredData.length / itemsPerPage)
          : Math.ceil(totalCount / itemsPerPage) || 1
      }
      breakLabel="..."
      pageRangeDisplayed={2}
      marginPagesDisplayed={2}
      activeClassName="active"
      pageClassName="page-item"
      breakClassName="page-item"
      nextLinkClassName="page-link"
      pageLinkClassName="page-link"
      breakLinkClassName="page-link"
      previousLinkClassName="page-link"
      nextClassName="page-item next-item"
      previousClassName="page-item prev-item"
      containerClassName="pagination react-paginate separated-pagination pagination-sm justify-content-end pe-1 mt-1"
    />
  );

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <Fragment>
      <div
        className="container"
        // style={{ height: "calc(100vh - 100px)", overflow: "auto" }}
      >
        <Card className="w-100">
          <Row className="justify-content-end mx-0">
            <Col
              className="d-flex align-items-center justify-content-end mt-1"
              md="6"
              sm="12"
            >
              <Input
                className="dataTable-filter mb-50"
                type="text"
                id="search-input"
                placeholder="Search here..."
                value={searchValue}
                onChange={handleFilter}
                style={{ width: "200px" }}
              />
{/* 
              <Button
                className="ms-2 mb-50 d-flex align-items-center"
                color="primary"
                onClick={handleAddProduct}
                style={{ minWidth: "150px" }}
              >
                <Plus size={15} className="me-1" />
                <span>Add Product</span>
              </Button> */}
            </Col>
          </Row>
          <div className="react-dataTable">
            <DataTable
              noHeader
              pagination
              columns={columns}
              paginationPerPage={itemsPerPage}
              className="react-dataTable"
              sortIcon={<ChevronDown size={10} />}
              paginationComponent={CustomPagination}
              paginationDefaultPage={currentPage}
              data={searchValue.length ? filteredData : logs}
            />
          </div>
        </Card>
      </div>
    </Fragment>
  );
};

export default LogsTable;

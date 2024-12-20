import './App.css';
import Papa from 'papaparse';
import React, { useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';
import axios from "axios";

function App() {

  const [csvData, setCsvData] = useState([]);

  //Pagination
  const [currentItems, setCurrentItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [endOffset, setEndOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("select");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isFileError, setFileError] = useState(false);
  const itemsPerPage = 5;


  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      setEndOffset(itemOffset + itemsPerPage);
      setCurrentItems(filteredData.slice(itemOffset, endOffset));
      if (filteredData.length <= itemsPerPage) {
        setPageCount(1);
      } else {
        setPageCount(Math.ceil(filteredData.length / itemsPerPage) - 1);
      }
    }
  }, [itemOffset, itemsPerPage, filteredData, endOffset])

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
    const newOffset = (event.selected * itemsPerPage) % filteredData.length;
    setItemOffset(newOffset);
    setEndOffset(newOffset + itemsPerPage);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploadedFile) {
      if (uploadStatus === "done") {
        return;
      }

      try {
        setUploadStatus("uploading");
        setCurrentPage(0);
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await axios.post(
          "http://httpbin.org/post",
          formData,
          {
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );

              setProgress(percentCompleted);
            },
          }
        );
        setUploadStatus("done");
      } catch (error) { console.log(error.response); setUploadStatus("select"); }
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    const allowedTypes = ["text/csv"];
    setProgress(0);
    setUploadStatus("select");
    setUploadedFile(null);

    if (!file) {
      setFileError(false);
      return;
    }

    if (!allowedTypes.includes(file?.type)) {
      setFileError(true);
      return;
    }

    setFileError(false);

    if (file) {
      setUploadedFile(file);
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
          setFilteredData(results.data);
          resetDisplayData(results.data);
        }
      })
    } else {
      console.log("Please select your file.");
    }
  }

  const handleSearch = (e) => {
    const searchInput = e.target.value;
    if (csvData.length > 0) {
      if (searchInput) {
        const findData = csvData && csvData.length > 0 ? csvData.filter((record) =>
          String(record.name).includes(searchInput) ||
          String(record.body).includes(searchInput) ||
          String(record.email).includes(searchInput) ||
          String(record.id).includes(searchInput) ||
          String(record.postId).includes(searchInput)
        ) : undefined;
        if (findData.length > 0) {
          resetDisplayData(findData);
          setFilteredData(findData);
        } else {
          setCurrentItems([]);
        }
      } else {
        resetDisplayData(csvData);
        setFilteredData(csvData);
      }
      setCurrentPage(0);
    }
  }

  const resetDisplayData = (data) => {
    setItemOffset(0);
    setEndOffset(itemOffset + itemsPerPage);
    setCurrentItems(data.slice(itemOffset, endOffset));
    if (data.length <= itemsPerPage) {
      setPageCount(1);
    } else {
      setPageCount(Math.ceil(data.length / itemsPerPage) - 1);
    }
  }

  return (
    <div className="wrapper">
      {/* <h3>Read CSV file Application</h3> */}
      <form className="form-group custom-form">
        <input type="file" className="form-control" required onChange={handleFileSelect} accept=".csv" />
        <button className="btn btn-primary btn-md" onClick={handleFileUpload} >UPLOAD</button>
        {isFileError && <div className="alert alert-danger" role="alert">Only CSV file is allowed.</div>}
        {/* {progress === 100 && <div className="alert alert-success" role="alert">File uploaded successfully!</div>} */}
      </form>

      {uploadStatus === "done" && csvData.length > 0 && (
        <form className="form-group custom-form-input">
          <input onChange={handleSearch} placeholder="Search Text" className="form-control" />
        </form>
      )}

      <form className="form-group">
        {progress > 0 && (
          <>
            {/* <progress id="progress-bar" value={`${progress}`}></progress> */}
            <span className="custom-form">
              <div className="progress-bg">
                <div className="progress" style={{ width: `${progress}%` }} />
              </div>
              <span className="upload-progress">{`${progress}%`}</span>
            </span>

          </>
        )}

        {uploadStatus === "done" && currentItems.length > 0 && (
          <>
            <ReactPaginate
              breakLabel="..."
              nextLabel="next >"
              onPageChange={handlePageClick}
              pageRangeDisplayed={5}
              pageCount={pageCount}
              forcePage={currentPage}
              previousLabel="< previous"
              renderOnZeroPageCount={null}
              containerClassName="pagination"
              pageClassName="page-num"
              previousLinkClassName="page-num"
              nextLinkClassName="page-num"
              activeClassName="active"
            />
          </>
        )}
      </form>

      <div className="viewer">
        {uploadStatus === "done" && currentItems.length > 0 ? (
          <div className="table-responsive">
            <table className="table" >
              <thead>
                <tr>
                  {Object.keys(csvData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>

              {/* {currentItems.filter((item) => {
                  return search.toLowerCase() === '' ? item : item.
                }) */}
              <tbody>
                {currentItems.map((individualCsvData, index) => {
                  return <tr key={index}>
                    {Object.keys(individualCsvData).map((key) => (
                      <td scope="row" key={key}>{individualCsvData[key]}</td>
                    ))}
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-record">No Records</div>
        )}
      </div>
    </div>
  );
}


export default App;
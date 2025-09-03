import React, { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Spinner,
  Form,
  Row,
  Col
} from "reactstrap"
import toast from "react-hot-toast"
import { Upload } from "react-feather"
import { useImportProductsMutation } from "../../slices/importApislice"

const ImportPage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const [importProducts] = useImportProductsMutation()

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      toast.success("File selected successfully")
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'text/csv') {
        setSelectedFile(file)
        toast.success("File selected successfully")
      } else {
        toast.error("Please select a valid Excel or CSV file")
      }
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('products', selectedFile)

      console.log("formData", formData)
      const response = await importProducts(formData).unwrap()

      if (response.successCount > 0) {
        toast.success(`Successfully imported ${response.successCount} products!`)
      } else {
        toast.warning("No products were imported. Please check your file format.")
      }

      if (response.failedCount > 0) {
        toast.error(`${response.failedCount} rows failed to import. Check the console for details.`)
        console.log("Failed rows:", response.failedRows)
      }

      setSelectedFile(null)

    } catch (error) {
      console.error("Import error:", error)
      toast.error(error?.data?.message || "Import failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Import Products</CardTitle>
        <p className="text-muted mb-0">
          Upload an Excel file with the following columns: SL NO, ITEM NAME, UNIT, QUANTITY, PRICE PER QUANTITY, TOTAL PRICE OF QTY (optional), WAREHOUSE TYPE (optional)
        </p>
      </CardHeader>
      <CardBody>
        <Row>
          <Col md="8" className="mx-auto">
            <Form>
              <div className="mb-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragOver ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
                    }`}
                  style={{
                    borderStyle: 'dotted',
                    borderWidth: '3px',
                    borderColor: isDragOver ? '#7367f0' : '#dee2e6'
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="fileInput"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="d-none"
                  />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <Upload size={48} className={`mb-3 ${isDragOver ? 'text-primary' : 'text-muted'}`} />
                    <div className="text-lg font-medium mb-2">
                      {selectedFile ? selectedFile.name : "Drag and drop your file here"}
                    </div>
                    <div className="text-sm text-muted mb-3">
                      or click to browse
                    </div>
                    <div className="text-xs text-muted">
                      Supported formats: Excel (.xlsx, .xls), CSV files
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-3 text-center">
                    <div className="text-success">
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>
                )}
              </div>

              <Button
                color="primary"
                onClick={handleImport}
                disabled={!selectedFile || isUploading}
                size="lg"
                className="w-100"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Importing Products...
                  </>
                ) : (
                  <>
                    <Upload size={20} className="me-2" />
                    Import Products
                  </>
                )}
              </Button>
            </Form>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default ImportPage 
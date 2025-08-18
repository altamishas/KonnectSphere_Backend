import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
  X,
  Upload,
} from "lucide-react";
import FormSection from "./shared/FormSection";
import { DocumentsFormData } from "@/lib/types";

interface DocumentsFormProps {
  onSubmit: (data: DocumentsFormData) => void;
  onHelpContextChange: (context: string) => void;
  formData?: {
    documents?: Partial<DocumentsFormData>;
  };
}

// Form validation schema - no documents are required
// Define the document type
const documentSchema = z.object({
  public_id: z.string(),
  url: z.string(),
  originalName: z.string(),
});

// Define the form schema with consistent optional fields
const formSchema = z.object({
  businessPlan: documentSchema.optional(),
  financials: documentSchema.optional(),
  pitchDeck: documentSchema.optional(),
  executiveSummary: documentSchema.optional(),
  additionalDocuments: z.array(documentSchema).optional(),
});

// Create explicit type for the form data
type DocumentFormData = {
  businessPlan?: z.infer<typeof documentSchema>;
  financials?: z.infer<typeof documentSchema>;
  pitchDeck?: z.infer<typeof documentSchema>;
  executiveSummary?: z.infer<typeof documentSchema>;
  additionalDocuments?: z.infer<typeof documentSchema>[];
};

interface DocumentFile {
  name: string;
  type: string;
  size: string;
  uploadProgress: number;
  file: File;
  uploaded?: {
    public_id: string;
    url: string;
    originalName: string;
  };
}

const DocumentsForm = ({
  onSubmit,
  onHelpContextChange,
  formData,
}: DocumentsFormProps) => {
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [files, setFiles] = useState<{
    businessPlan: DocumentFile | null;
    financials: DocumentFile | null;
    pitchDeck: DocumentFile | null;
    executiveSummary: DocumentFile | null;
    additionalDocuments: DocumentFile[];
  }>({
    businessPlan: null,
    financials: null,
    pitchDeck: null,
    executiveSummary: null,
    additionalDocuments: [],
  });

  // File input refs
  const businessPlanInputRef = useRef<HTMLInputElement>(null);
  const financialsInputRef = useRef<HTMLInputElement>(null);
  const pitchDeckInputRef = useRef<HTMLInputElement>(null);
  const executiveSummaryInputRef = useRef<HTMLInputElement>(null);
  const additionalDocsInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessPlan: formData?.documents?.businessPlan,
      financials: formData?.documents?.financials,
      pitchDeck: formData?.documents?.pitchDeck,
      executiveSummary: formData?.documents?.executiveSummary,
      additionalDocuments: formData?.documents?.additionalDocuments || [],
    },
  });

  const handleSubmit = (values: DocumentFormData) => {
    // Prepare the data with uploaded documents and files for upload
    const submitData: DocumentsFormData = {
      // Existing uploaded documents
      businessPlan: values.businessPlan,
      financials: values.financials,
      pitchDeck: values.pitchDeck,
      executiveSummary: values.executiveSummary,
      additionalDocuments: values.additionalDocuments || [],
      // New files to upload
      businessPlanFile: files.businessPlan?.file,
      financialsFile: files.financials?.file,
      pitchDeckFile: files.pitchDeck?.file,
      executiveSummaryFile: files.executiveSummary?.file,
      additionalDocumentFiles: files.additionalDocuments.map((f) => f.file),
    };

    onSubmit(submitData);
  };

  const handleFieldFocus = (fieldName: string) => {
    switch (fieldName) {
      case "pitchDeck":
        onHelpContextChange("documents-pitchdeck");
        break;
      case "businessPlan":
        onHelpContextChange("documents-businessplan");
        break;
      case "executiveSummary":
        onHelpContextChange("documents-executivesummary");
        break;
      case "financials":
        onHelpContextChange("documents-financials");
        break;
      case "additionalDocuments":
      case "documents":
        onHelpContextChange("documents-upload");
        break;
      default:
        onHelpContextChange("");
    }
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    elementId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(elementId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    fieldName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file, fieldName);
    }
  };

  const handleFileSelect = (file: File, fieldName: string) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please select a valid document file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV)"
      );
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    let fileType = "document";

    if (["pdf"].includes(fileExtension)) {
      fileType = "pdf";
    } else if (["doc", "docx"].includes(fileExtension)) {
      fileType = "doc";
    } else if (["xls", "xlsx", "csv"].includes(fileExtension)) {
      fileType = "spreadsheet";
    } else if (["ppt", "pptx"].includes(fileExtension)) {
      fileType = "presentation";
    }

    // Convert file size to readable format
    const fileSize =
      file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // Create file object
    const newFile: DocumentFile = {
      name: file.name,
      type: fileType,
      size: fileSize,
      uploadProgress: 0,
      file: file,
    };

    // Add file to state (files will be uploaded when form is submitted)
    if (fieldName === "additionalDocuments") {
      setFiles((prev) => ({
        ...prev,
        additionalDocuments: [...prev.additionalDocuments, newFile],
      }));
    } else {
      setFiles((prev) => ({
        ...prev,
        [fieldName]: newFile,
      }));
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelect(file, fieldName);
    }
  };

  const getFileInputRef = (fieldName: string) => {
    switch (fieldName) {
      case "businessPlan":
        return businessPlanInputRef;
      case "financials":
        return financialsInputRef;
      case "pitchDeck":
        return pitchDeckInputRef;
      case "executiveSummary":
        return executiveSummaryInputRef;
      case "additionalDocuments":
        return additionalDocsInputRef;
      default:
        return null;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-10 w-10 text-red-500" />;
      case "doc":
        return <File className="h-10 w-10 text-blue-500" />;
      case "spreadsheet":
        return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
      case "presentation":
        return <Presentation className="h-10 w-10 text-orange-500" />;
      default:
        return <File className="h-10 w-10 text-slate-400" />;
    }
  };

  const handleRemoveFile = (fieldName: string, index?: number) => {
    if (fieldName === "additionalDocuments" && typeof index === "number") {
      const newFiles = [...files.additionalDocuments];
      newFiles.splice(index, 1);
      setFiles((prev) => ({
        ...prev,
        additionalDocuments: newFiles,
      }));
    } else {
      setFiles((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }

    // Clear the file input
    const inputRef = getFileInputRef(fieldName);
    if (inputRef?.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveUploadedDocument = (fieldName: string, index?: number) => {
    if (fieldName === "additionalDocuments" && typeof index === "number") {
      const current = form.getValues("additionalDocuments") || [];
      const updated = current.filter((_, i) => i !== index);
      form.setValue("additionalDocuments", updated);
    } else {
      form.setValue(fieldName as keyof DocumentFormData, undefined);
    }
  };

  const renderDocumentUpload = (
    fieldName: keyof DocumentFormData,
    label: string,
    description: string,
    file: DocumentFile | null,
    uploadedDoc:
      | {
          public_id: string;
          url: string;
          originalName: string;
        }
      | undefined,
    required: boolean = false
  ) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem className="space-y-3">
          <FormLabel>
            {label}
            {required ? "" : " (Optional)"}
          </FormLabel>
          <FormControl>
            <div className="space-y-3">
              {/* Show already uploaded document */}
              {uploadedDoc && (
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                          {uploadedDoc.originalName}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Already uploaded
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-red-600"
                        onClick={() => handleRemoveUploadedDocument(fieldName)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File upload area - only show if no uploaded document or new file selected */}
              {(!uploadedDoc || file) && (
                <div
                  className={`
                    transition-colors cursor-pointer rounded-lg overflow-hidden border-2
                    ${
                      dragActive === fieldName
                        ? "bg-primary/5 border-primary"
                        : file
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-600"
                    }
                  `}
                  onDragEnter={(e) => handleDragEnter(e, fieldName)}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, fieldName)}
                  onClick={() => {
                    handleFieldFocus(String(fieldName));
                    getFileInputRef(fieldName)?.current?.click();
                  }}
                >
                  <input
                    ref={getFileInputRef(fieldName)}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e, fieldName)}
                  />
                  {file ? (
                    <div className="p-4">
                      <div className="flex items-center">
                        {getFileIcon(file.type)}
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {file.size} • Ready to upload
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(fieldName);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6">
                      <Upload className="h-10 w-10 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                        {uploadedDoc
                          ? "Replace with new file"
                          : "Drag and drop your file here, or click to browse"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Supported formats: PDF, DOCX, XLSX, PPTX (Max: 10MB)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormSection
          title="Pitch Documents"
          description="Upload your key business documents for investor review"
        >
          <div className="space-y-6">
            {renderDocumentUpload(
              "pitchDeck",
              "Pitch Deck",
              "A presentation that summarizes your business idea, market opportunity, and growth plans",
              files.pitchDeck,
              form.getValues("pitchDeck")
            )}

            {renderDocumentUpload(
              "businessPlan",
              "Business Plan",
              "A comprehensive document detailing your business strategy and execution plans",
              files.businessPlan,
              form.getValues("businessPlan")
            )}

            {renderDocumentUpload(
              "executiveSummary",
              "Executive Summary",
              "A short document summarizing the key points of your business plan",
              files.executiveSummary,
              form.getValues("executiveSummary")
            )}

            {renderDocumentUpload(
              "financials",
              "Financial Projections",
              "Detailed financial forecasts including income statements, cash flow, and balance sheets",
              files.financials,
              form.getValues("financials")
            )}
          </div>
        </FormSection>

        <FormSection
          title="Additional Documents"
          description="Provide any other documents that strengthen your pitch"
        >
          <div className="space-y-4">
            {/* Show uploaded additional documents */}
            {(form.getValues("additionalDocuments") || []).map((doc, index) => (
              <Card
                key={`uploaded-${index}`}
                className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              >
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Already uploaded
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:text-red-600"
                      onClick={() =>
                        handleRemoveUploadedDocument(
                          "additionalDocuments",
                          index
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Show new files ready to upload */}
            {files.additionalDocuments.map((file, index) => (
              <Card key={`new-${index}`} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    {getFileIcon(file.type)}
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {file.size} • Ready to upload
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        handleRemoveFile("additionalDocuments", index)
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Upload area for additional documents */}
            <div
              className={`
                flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg
                transition-colors cursor-pointer
                ${
                  dragActive === "additionalDocuments"
                    ? "border-primary bg-primary/5"
                    : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }
              `}
              onDragEnter={(e) => handleDragEnter(e, "additionalDocuments")}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "additionalDocuments")}
              onClick={() => {
                handleFieldFocus("additionalDocuments");
                getFileInputRef("additionalDocuments")?.current?.click();
              }}
            >
              <input
                ref={getFileInputRef("additionalDocuments")}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv"
                className="hidden"
                onChange={(e) =>
                  handleFileInputChange(e, "additionalDocuments")
                }
              />
              <Upload className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Drag and drop additional documents here, or click to browse
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Supported formats: PDF, DOCX, XLSX, PPTX (Max: 10MB)
              </p>
            </div>

            <FormDescription>
              You can upload additional supporting documents like market
              research, patents, testimonials, etc.
            </FormDescription>
          </div>
        </FormSection>

        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.history.back();
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Media
          </Button>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            Continue to Packages
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentsForm;

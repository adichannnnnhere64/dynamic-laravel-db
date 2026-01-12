import React from "react";
import { Button } from "@/components/ui/button";
import { Save, X, RefreshCw } from "lucide-react";

interface FormFooterProps {
  processing: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
  showReset?: boolean;
  onReset?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormFooter({
  processing,
  onCancel,
  onSubmit,
  showReset = false,
  onReset,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
}: FormFooterProps) {
  return (
    <div className="flex justify-between pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={processing}
      >
        <X className="w-4 h-4 mr-2" />
        {cancelLabel}
      </Button>
      <div className="flex gap-2">
        {showReset && onReset && (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={processing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}
        {onSubmit && (
          <Button
            type="submit"
            disabled={processing}
            onClick={onSubmit}
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

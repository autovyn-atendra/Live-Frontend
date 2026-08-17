// components/ConfirmDialog.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface ConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
}

export const ConfirmDialog = ({
    open,
    onConfirm,
    onCancel,
    title = "Are you sure?",
    description = "This action cannot be undone.",
}: ConfirmDialogProps) => {
    return (
        <Dialog.Root open={open}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 backdrop-blur bg-black/40 z-40 transform transition-all duration-300 ease-out scale-95 data-[state=open]:scale-100" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg focus:outline-none">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-exit/10">
                            <ExclamationTriangleIcon className="h-6 w-6 text-yellow" />
                        </div>
                        <div className="flex-1">
                            <Dialog.Title className="text-lg font-semibold text-black">
                                {title}
                            </Dialog.Title>
                            <Dialog.Description className="mt-2 text-sm text-grey">
                                {description}
                            </Dialog.Description>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="w-full sm:w-auto rounded-md bg-yellow px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
                        >
                            Stay Multi Branch
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full sm:w-auto rounded-md bg-off px-4 py-2 text-sm font-medium text-dark hover:bg-front transition"
                        >
                            Cancel
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

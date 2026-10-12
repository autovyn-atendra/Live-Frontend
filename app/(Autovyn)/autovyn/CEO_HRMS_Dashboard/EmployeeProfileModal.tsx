"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const InfoRow = ({ label, value }) => (
    <div className="flex items-start gap-3 py-2.5 last:border-0">
        <span className="text-[15px] font-semibold opacity-75 w-36 flex-shrink-0">{label}</span>
        <span className="text-[15px] flex-1 break-words font-medium">{value || 'N/A'}</span>
    </div>
);

const SectionTitle = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-borderColor dark:border-borderColor-dark">
        <span className="text-xl">{icon}</span>
        <h4 className="text-lg font-bold uppercase tracking-wide">{title}</h4>
    </div>
);

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length === 1
        ? parts[0].charAt(0).toUpperCase()
        : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function EmployeeProfileModal({ isOpen, onClose, data, isLoading }) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-screen-xl p-0 max-h-[90vh] overflow-hidden bg-white dark:bg-black border dark:border-borderColor-dark">
                {isLoading ? (
                    <div className="flex flex-col items-center py-20">
                        <div className="w-12 h-12 border-4 border-[#1f3b73] border-t-transparent rounded-full animate-spin" />
                        <p className="mt-3 text-[15px] opacity-70">Loading...</p>
                    </div>
                ) : data ? (
                    <>
                        <div className="bg-gradient-to-r from-[#1f3b73] to-[#2a5298] px-6 py-5">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    {data.photoUrl ? (
                                        <img src={data.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#37a9dd] to-[#1f3b73] flex items-center justify-center text-white font-bold text-3xl border-4 border-white">
                                            {getInitials(data.personalInfo?.name)}
                                        </div>
                                    )}
                                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{data.personalInfo?.name}</h2>
                                    <p className="text-[#DBEAFE] text-[16px] mt-1">{data.professionalInfo?.designation}</p>
                                    <div className="flex gap-2.5 mt-2 flex-wrap">
                                        {[
                                            `📁 ${data.professionalInfo?.employeeCode}`,
                                            `🏢 ${data.professionalInfo?.department}`,
                                            `📍 ${data.professionalInfo?.location}`
                                        ].map((tag, i) => (
                                            <span key={i} className="text-[15px] text-[#DBEAFE] bg-white/20 px-3 py-1 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-[#F9FAFB] dark:bg-[#111827]/50 rounded-xl p-4 border border-borderColor dark:border-borderColor-dark">
                                    <SectionTitle title="Professional Information" icon="💼" />
                                    {[ 
                                        ["Employee Code", data.professionalInfo?.employeeCode],
                                        ["Designation", data.professionalInfo?.designation],
                                        ["Department", data.professionalInfo?.department],
                                        ["Location", data.professionalInfo?.location],
                                        ["Region", data.professionalInfo?.region],
                                        ["Section", data.professionalInfo?.section],
                                        ["Shift", data.professionalInfo?.shift],
                                        ["Joining Date", data.professionalInfo?.joiningDate],
                                        ["Payment Mode", data.professionalInfo?.paymentMode],
                                        ["Bank Name", data.professionalInfo?.bankName],
                                        ["Bank Account", data.professionalInfo?.bankAccountNo],
                                        ["IFSC Code", data.professionalInfo?.ifscCode],
                                        ["PF Number", data.personalInfo?.pfNumber],
                                       ["Employee Salary", `₹ ${Number(data.professionalInfo?.salary || 0).toLocaleString()}`],
                                    ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                                </div>

                                <div className="bg-[#F9FAFB] dark:bg-[#111827]/50 rounded-xl p-4 border border-borderColor dark:border-borderColor-dark">
                                    <SectionTitle title="Personal Information" icon="👤" />
                                    {[
                                        ["Full Name", data.personalInfo?.name],
                                        ["Gender", data.personalInfo?.gender],
                                        ["Date of Birth", data.personalInfo?.dateOfBirth],
                                        ["Blood Group", data.personalInfo?.bloodGroup],
                                        ["Marital Status", data.personalInfo?.maritalStatus],
                                        ["Email ID", data.personalInfo?.email],
                                        ["Mobile No", data.personalInfo?.mobile],
                                        ["Emergency No", data.personalInfo?.emergencyNo],
                                        ["PAN No", data.personalInfo?.panNo],
                                        ["Aadhar No", data.personalInfo?.aadharNo],
                                        ["UAN No", data.personalInfo?.uanNo],
                                        ["Father's Name", data.personalInfo?.fatherName],
                                        ["Mother's Name", data.personalInfo?.motherName],
                                    ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                                </div>
                            </div>

                            <div className="mt-6">
                                <SectionTitle title="Address Information" icon="📍" />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {[
                                        ["🏠 Current Address", data.addressInfo?.current?.address],
                                        ["📬 Permanent Address", data.addressInfo?.permanent?.address]
                                    ].map(([title, address]) => (
                                        <div key={title} className="bg-[#F9FAFB] dark:bg-[#111827]/50 rounded-xl p-4 border dark:border-borderColor-dark">
                                            <h5 className="text-[16px] font-semibold mb-2">{title}</h5>
                                            <p className="text-[15px] opacity-80">{address || ''}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
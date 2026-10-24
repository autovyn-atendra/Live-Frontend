"use client";

import { useCurrentUser } from "@/app/hooks/use-current-user";
import AButton from "@/components/atoms/Buttton";
import Eselect from "@/components/atoms/Eselect";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import HashloaderComponent from "@/components/Templates/hashloader";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaUsers } from "react-icons/fa";
import Swal from "sweetalert2";
import { useSecureStorage } from "@/app/hooks/comp-key-data";

export default function SalaryLock() {

    function showSideAlert(message: any, type: any) {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                container: "side-alert-container",
                popup: `side-alert-${type}`,
                title: "side-alert-title",
                icon: "side-alert-icon",
            },
        });

        Toast.fire({
            icon: type,
            title: message,
        });
    }

    const { compdata } = useSecureStorage();
    const user = useCurrentUser();
    const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
    const [formdata, setFormData] = useState({
        Join_Date: null,
        Channel: null,
        Cluster: null,
        Region: null,
        Month: null,
    });
    const [CHANEELOPTION, setChannelOption] = useState([]);
    const [CLUSTEROPTION, setClusterOption] = useState([]);
    const [SalRegionoption, setSalRegionoption] = useState([]);
    const [locationData, setLocationData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [otpSending, setOtpSending] = useState<boolean>(false);
    const [LocationSearch, setLocationSearch] = useState('');

    const fetchLocationData = async () => {
        if (user?.EMPCODE && user?.Comp_Code) {
            setIsLoading(true);
            try {
                const locationsArray = user?.branch
                    ? String(user.branch).split(",").map(Number)
                    : [];

                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_URL}/SalaryLock/getLocationsByRegion`,
                    {
                        locations: locationsArray,
                        Channel: formdata.Channel,
                        Cluster: formdata.Cluster,
                        Region: formdata.Region,
                    },
                    {
                        headers: {
                            compcode: user.Comp_Code,
                            name: user.name,
                        }
                    }
                );

                setLocationData(response?.data?.results || []);
            } catch (error) {
                console.error("Error fetching locations:", error);
                showSideAlert("Error fetching data", "error");
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (user?.branch) {
            fetchLocationData();
        }
    }, [user?.branch, formdata.Channel, formdata.Cluster, formdata.Region]);


    const handleUpdateLocation = async () => {
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/SalaryLock/updateLocationDate`,
                {
                    regionCode: formdata?.Region,
                    joinDate: formdata?.Join_Date,
                    selectedLocations,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            if (result.data.Status) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Location Date Updated successfully.',
                });
                setSelectedLocations([]);
            }

            setFormData({
                Channel: null,
                Cluster: null,
                Region: null,
                Month: null,
                Join_Date: null,
            });

            await fetchLocationData();   // ✅ list turant refresh
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Warning',
                text: error.response?.data?.message || 'Error updating location',
            });
            console.error("Error updating location:", error);
        }
    };

    const handleUpdateClick = async () => {
        if (!formdata?.Region) {
            showSideAlert("Please select a Region.", "warning");
            return;
        }
        if (!formdata?.Join_Date) {
            showSideAlert("Please select a Lock Date", "warning");
            return;
        }
        if (selectedLocations.length === 0) {
            showSideAlert("Please select at least one location", "warning");
            return;
        }

        const selectedLocObjs = locationData.filter((loc) =>
            selectedLocations.includes(loc.value)
        );

        const newDate = new Date(formdata.Join_Date as any);

        const isBackdate = selectedLocObjs.some((loc) => {
            if (!loc.Lock_Date) return false;
            const oldDate = new Date(loc.Lock_Date);
            return new Date(newDate).setHours(0, 0, 0, 0) < new Date(oldDate).setHours(0, 0, 0, 0);
        });

        if (!isBackdate) {
            // normal forward date -> seedha update, OTP nahi
            await handleUpdateLocation();
            return;
        }

        // ✅ Backdate hai, lekin OTP number configured nahi hai -> seedha normal update
        if (!compdata?.SalaryUnlock) {
            await handleUpdateLocation();
            return;
        }

        // ---------- Backdate + number available -> OTP flow ----------
        try {
            setOtpSending(true);
            await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/SalaryLock/sendSalaryUnlockOtp`,
                {
                    mobile: compdata.SalaryUnlock,
                    joinDate: formdata.Join_Date,
                    locations: selectedLocations,
                },
                { headers: { compcode: user?.Comp_Code, name: user?.name } }
            );
            setOtpSending(false);

            const { value: otp, isConfirmed } = await Swal.fire({
                title: '<span style="color:#FF5944;font-weight:700;">Salary Unlock - OTP Verification</span>',
                html: `
               <p style="font-size:14px;color:#333;margin-bottom:8px;">
An OTP has been sent to <b style="color:#FF5944;">${compdata.SalaryUnlock}</b> for salary unlock verification.<br/>
Please enter the 6-digit OTP below:
</p>
            `,
                input: 'text',
                inputAttributes: {
                    maxlength: '6',
                    autocapitalize: 'off',
                    autocorrect: 'off',
                    inputmode: 'numeric',
                },
                inputPlaceholder: 'Enter 6-digit OTP',
                showCancelButton: true,
                confirmButtonText: 'Verify & Update',
                cancelButtonText: 'No',
                reverseButtons: true,
                confirmButtonColor: '#FF5944',
                cancelButtonColor: '#6b7280',
                inputValidator: (value) => {
                    if (!value) return 'OTP is required';
                    if (!/^\d{6}$/.test(value)) return 'Please enter a valid 6-digit OTP';
                },
            });

            if (!isConfirmed || !otp) {
                setFormData((prev) => ({ ...prev, Join_Date: null }));
                return;
            }

            const verifyRes = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/SalaryLock/verifySalaryUnlockOtp`,
                { mobile: compdata.SalaryUnlock, otp },
                { headers: { compcode: user?.Comp_Code, name: user?.name } }
            );

            if (!verifyRes.data.Status) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid OTP',
                    text: verifyRes.data.Message,
                    confirmButtonColor: '#FF5944',
                });
                setFormData((prev) => ({ ...prev, Join_Date: null }));
                return;
            }

            await handleUpdateLocation();

        } catch (err) {
            console.error("OTP flow error:", err);
            setOtpSending(false);
            showSideAlert("OTP process failed.", "error");
            setFormData((prev) => ({ ...prev, Join_Date: null }));
        }
    };

    const handleCheckboxChange = (name: number) => {
        setSelectedLocations((prev) =>
            prev.includes(name)
                ? prev.filter((location) => location !== name)
                : [...prev, name]
        );
    };

    const handleSelectAll = () => {
        const filteredIds = filteredLocations.map((loc) => loc.value);

        const allSelected = filteredIds.every((id) =>
            selectedLocations.includes(id)
        );

        if (allSelected) {
            setSelectedLocations((prev) =>
                prev.filter((id) => !filteredIds.includes(id))
            );
        } else {
            setSelectedLocations((prev) => [
                ...new Set([...prev, ...filteredIds]),
            ]);
        }
    };

    const handleInputChange = (name: any, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            const data = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/employee/masters`,
                {},
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            )
            const convertValuesToString = (array: any) => {
                return array.map((obj: any) => {
                    return {
                        label: obj.label,
                        value: String(obj.value),
                    };
                });
            };
            const masters = data.data.data;
            setChannelOption(convertValuesToString(masters.CHANNEL1));
            setClusterOption(convertValuesToString(masters.CLUSTER1));
            setSalRegionoption(convertValuesToString(masters.Sal_Region));
        };
        fetchData();
    }, []);

    const filteredLocations = locationData.filter((location) =>
        location.label
            ?.toLowerCase()
            .includes(LocationSearch.toLowerCase())
    );

    return (
        <div>
            <div className="grid grid-cols-12 ">

                <div className="col-span-12 rounded-t bg-[#1a1f2e] dark:bg-black px-2 md:px-6 py-2 border dark:border-[#2a2f3e]">
                    <div className="flex justify-between ">
                        <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
                            <Image src="/Payrollicon/attendence_calculation.png" alt="Autovyn" width={25} height={25} />
                            SALARY LOCK
                        </h1>
                        <div className="flex gap-2 ">
                            <Button variant="print" onClick={() => { window.history.back() }}>Back</Button>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-3"></div>

                <div className="col-span-12 lg:col-span-6 md:col-span-10 sm:col-span-12 gap-2 md:gap-3 mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-[#e2e2e2] dark:border-[#2a2f3e] shadow">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 md:col-span-3 flex justify-between items-center">
                            <Eselect
                                title={"Channel"}
                                name={"Channel"}
                                initialValue={formdata.Channel?.toString()}
                                option={CHANEELOPTION}
                                handleInputChange={handleInputChange}
                                h={9}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 flex justify-between items-center">
                            <Eselect
                                title={"Cluster"}
                                name={"Cluster"}
                                initialValue={formdata.Cluster?.toString()}
                                option={CLUSTEROPTION}
                                handleInputChange={handleInputChange}
                                h={9}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 flex justify-between items-center">
                            <Eselect
                                title={"Region"}
                                name={"Region"}
                                initialValue={formdata.Region?.toString()}
                                option={SalRegionoption}
                                handleInputChange={handleInputChange}
                                h={9}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 flex justify-between items-center mt-4">
                            <Ainput
                                title={"Lock Date"}
                                type={"date"}
                                handleInputChange={handleInputChange}
                                name={"Join_Date"}
                                value={formdata?.Join_Date}
                            />
                        </div>

                        <div className="col-span-12 mt-2">
                            <input
                                placeholder="Search Location..."
                                value={LocationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                type="search"
                                className="h-9 px-3 border border-[#e2e2e2] dark:border-[#2a2f3e] rounded w-full text-sm shadow-sm transition-colors placeholder:text-[#94a3b8] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5944] dark:placeholder:text-[#64748b]"
                            />
                        </div>

                        {/* Location List */}
                        <div className="col-span-12 p-1 ">
                            <div className="border border-[#e2e2e2] dark:border-[#2a2f3e] rounded p-2">
                                <h2 className="font-bold mb-2 text-[#1a1f2e] dark:text-white">Locations</h2>
                                <div className="max-h-64 overflow-y-auto">
                                    {isLoading ? (
                                        <HashloaderComponent isLoading={isLoading} />
                                    ) : (
                                        filteredLocations.map((location) => (
                                            <div
                                                key={location.value}
                                                className="flex items-center justify-between border-b border-[#e2e2e2] dark:border-[#2a2f3e] p-1"
                                            >
                                                <label className="flex items-center space-x-2 text-[#1a1f2e] dark:text-white">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLocations.includes(location.value)}
                                                        onChange={() => handleCheckboxChange(location.value)}
                                                        className="size-3.5 hover:cursor-pointer accent-[#FF5944]"
                                                        aria-label={`Select ${location.label}`}
                                                    />
                                                    <span className="hover:cursor-pointer ">
                                                        {location.label}
                                                    </span>
                                                </label>
                                                <span className="text-[#94a3b8]">
                                                    {location.Lock_Date
                                                        ? location.Lock_Date.split('T')[0].split('-').reverse().join('-')
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button
                                    className="mt-2 bg-[#49b514] px-3 py-1 rounded text-white hover:bg-[#e64d3a] transition-colors"
                                    onClick={handleSelectAll}
                                >
                                    {
                                        filteredLocations.length > 0 &&
                                            filteredLocations.every((loc) =>
                                                selectedLocations.includes(loc.value)
                                            )
                                            ? "Deselect All"
                                            : "Select All Locations"
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="col-span-12 mt-3 flex justify-center gap-x-3">
                            <Button
                                variant={"update"}
                                type="submit"
                                onClick={handleUpdateClick}
                                disabled={otpSending}
                                className="px-8"
                                
                            >
                                {otpSending ? "Sending OTP..." : "Update"}
                            </Button>
                            <Button
                                size={"default"}
                                variant={"print"}
                                onClick={() => {
                                    history.back();
                                }}
                                className="mr-3 px-8"
                            >
                                Back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <HashloaderComponent isLoading={isLoading} />
        </div>
    );
}
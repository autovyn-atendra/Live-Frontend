"use client";
import { treeData } from "@/constant/modules";
import React, { useState, useEffect, useRef } from "react";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Fselect from "@/components/atoms/Fselectuser";
import axios from "axios";
import Swal from "sweetalert2";
import { GrUserAdmin } from "react-icons/gr";

const ShortcutDropdown = () => {
    const user = useCurrentUser()
    const [extractedData, setextractedData] = useState(extractLabelsAndValues(treeData,user))
    const shortcuts = Array.from({ length: 10 }, (_, i) => `alt+${i}`);
    const [selectedOptions, setSelectedOptions] = useState({});
    function extractLabelsAndValues(treeData, user) {
        let result = [];
    
        function traverse(nodes) {
            nodes.forEach(node => {
                if (node.url && user.role.includes(node.key)) { 
                    result.push({
                        value: node.url,
                        label: node.title
                    });
                }
                if (node.children) {
                    traverse(node.children);
                }
            });
        }
    
        traverse(treeData);
        return result;
    }
    


    const handleChange = (name, value) => {
        setSelectedOptions(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const saveUserData = async () => {
        try {
            const response1 = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/myshortcuts`,
                { selectedOptions, usercode: user?.id },
                {
                    headers: {
                        compcode: user?.Comp_Code,name:user?.name,
                        token: user?.email,
                    },
                }
            );
            Swal.fire({
                icon: "success",
                title: "Shortcut Updated Successfully",
                text: "",
            });
        } catch (err) {
            console.log(err);
        }
    }
    useEffect(() => {
        const fetchShortcuts = async () => {
            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_URL}/users/getMyShortcuts`,
                    { usercode: user?.id },
                    {
                        headers: {
                            compcode: user?.Comp_Code,name:user?.name,
                            token: user?.email,
                        },
                    }
                );

                // Ensure response data is correctly structured before setting state
                if (response.data) {
                    setSelectedOptions(response.data);
                }
            } catch (err) {
                console.log("Error fetching shortcuts:", err);
            }
        };

        if (user?.id) {
            fetchShortcuts();
        }
    }, [user?.id]); // Run only when user ID is available


    return (
        <main className="grid grid-cols-12 w-full">
            <section className="py-1 bg-blueGray-50 lg:col-span-8 col-span-12 ">
                <div className="w-full  px-1">
                    <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
                    <div className="rounded-t bg-white dark:bg-dark mb-0 px-6">
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-2">
      <GrUserAdmin size={22} className="text-gray-700 dark:text-gray-300" />
      <MediumTitle text="My Shortcuts" />
    </div>
    <div className="flex gap-x-2">
      <Button
        type="submit"
        variant="save"
        onClick={saveUserData}
      >
        Save
      </Button>

      <Button
        type="button"
        variant="print"
        onClick={() => window.history.back()}
        className="flex items-center gap-1"
      >
        Back
      </Button>
    </div>
  </div>
</div>
                        <div className="flex-auto px-1 py-6 pt-0">
                            <div className="p-4 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 col-span-2">
                                    <span className="font-bold w-28 whitespace-nowrap text-ellipsis">Login Screen</span>
                                    <Fselect
                                        value={selectedOptions.login?.toString()}
                                        initialValue={selectedOptions.login?.toString()}
                                        name={"login"}
                                        option={extractedData}
                                        handleInputChange={handleChange}
                                    />
                                </div>

                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex items-center gap-4 whitespace-nowrap text-ellipsis">
                                        <span className="font-bold w-36 uppercase">{shortcut}</span>
                                        <Fselect
                                            initialValue={selectedOptions[shortcut]?.toString()}
                                            value={selectedOptions[shortcut]?.toString()}
                                            name={shortcut}
                                            option={extractedData}
                                            handleInputChange={handleChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>

    );
};

export default ShortcutDropdown;

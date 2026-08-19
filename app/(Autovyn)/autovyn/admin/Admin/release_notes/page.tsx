"use client"
import { useCurrentUser } from '@/app/hooks/use-current-user';
import DataTable from '@/components/Templates/servicetable';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

function ReleaseNotesForm() {
    const user = useCurrentUser()
    const [tabledata, setTabledata] = useState([]);
    const [formData, setFormData] = useState({
        module_name: '',
        platform: '',
        release_date: '',
        description: '',
        created_by: user?.name,
    });
    const columns1 = [
        { Header: "id", accessor: "id" },
        { Header: "module_name", accessor: "module_name" },
        { Header: "platform", accessor: "platform" },
        { Header: "release_date", accessor: "release_date" },
        { Header: "description", accessor: "description" }
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const save = async () => {
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/addrelease`,
                formData,
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                        token: user?.email
                    },
                }
            );
            Swal.fire({
                icon: "success",
                title: "Success!",
                text: "Release note added successfully!",
            })
            setFormData({
                module_name: '',
                platform: '',
                release_date: '',
                description: '',
                created_by: user?.name,
            });
            await findall()
        } catch (err) {
            console.log(err)
        }
    };
    const update = async () => {
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/updaterelease`,
                formData,
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                        token: user?.email
                    },
                }
            );
            Swal.fire({
                icon: "success",
                title: "Success!",
                text: "Release note Updated successfully!",
            })
            setFormData({
                module_name: '',
                platform: '',
                release_date: '',
                description: '',
                created_by: user?.name,
            });
            await findall()
        } catch (err) {
            console.log(err)
        }
    };
    const findall = async () => {
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/findrelease`,
                formData,
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                        token: user?.email
                    },
                }
            );
            setTabledata(result.data)
        } catch (err) {
            console.log(err)
        }
    };

    useEffect(() => {
        findall()
    }, [])

    const handleclick = (row) => {
        setFormData(row)
    }
    return (
        <div className="grid grid-cols-12 w-full gap-x-4">
            <div className="col-span-4 ">
                <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-md h-full">
                    <h2 className="text-xl font-bold mb-4">Add Release Note</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" htmlFor="module_name">Module Name</label>
                        <input
                            type="text"
                            id="module_name"
                            name="module_name"
                            value={formData.module_name}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" htmlFor="platform">Platform</label>
                        <select
                            id="platform"
                            name="platform"
                            value={formData.platform}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2"
                            required
                        >
                            <option value="">Select Platform</option>
                            <option value="web">Web</option>
                            <option value="mobile">Mobile</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" htmlFor="release_date">Release Date</label>
                        <input
                            type="date"
                            id="release_date"
                            name="release_date"
                            value={formData.release_date}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2"
                            required
                        />
                    </div>
                    {user?.name == 'development' && (
                        <>
                            {formData.id &&
                                <button type="button" onClick={update} className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600">
                                    update
                                </button>
                            }
                            {!formData?.id &&
                                <button type="button" onClick={save} className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600">
                                    Submit
                                </button>
                            }</>
                    )}

                </div>
            </div>
            <div className="col-span-8 ">
                <div className=" w-full h-full p-2 bg-white dark:bg-primary dark:bg-opacity-10 shadow-md rounded-md">
                    <h2 className="text-xl font-bold mb-4 text-center">All Release Note</h2>
                    <DataTable
                        columns={columns1}
                        data={tabledata}
                        onRowDoubleClick={handleclick}
                        filterPosition="FilterData"
                        numericFilterColumns={[]}
                    />
                </div>
            </div>
        </div>

    );
}

export default ReleaseNotesForm;

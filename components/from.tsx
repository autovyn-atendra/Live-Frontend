import React, { useState } from 'react';

const ExpandableForm = ({ onSubmit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Additional form submission logic if needed
    onSubmit(formData);
  };

  const formStyle = isExpanded ? 'w-full h-full' : 'w-80 h-40'; // Default width

  return (
    <div
      className={`cursor-pointer p-2 bg-white bg-opacity-80 hover:bg-white hover:bg-opacity-20 hover:shadow-md dark:shadow-lg dark:bg-primary dark:bg-opacity-10  rounded-2xl shadow-md ${formStyle}`}
      onClick={handleClick}
    >
      <form onSubmit={handleSubmit} className="flex flex-col ">
        <div className="flex space-y-2">
          <label className="w-1/4 mt-3 text-xs px-1">Emp Code</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 rounded-md py-2 px-1 text-xs"
          />
          <label className="w-1/4 mt-3 px-1 text-xs">Title</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 rounded-md py-2 px-1 text-xs"
          />
          <label className="w-1/4 mt-3 px-1 text-xs">First Name</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 rounded-md py-2 px-1 text-xs"
          />
        </div>

        <div className="flex space-y-2">
          <label className="w-1/4 mt-3 px-1 text-xs">Last Name</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 rounded-md py-2 px-1 text-xs"
          />
          <label className="w-1/4 mt-3 px-1 text-xs">Gender</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 rounded-md py-2 px-1 text-xs"
          />
          <label className="w-1/4 mt-3 px-1 text-xs">Emp Type</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 rounded-md py-2 px-1 text-xs"
          />
        </div>

        {isExpanded && (
          <>
            <div className="flex space-y-2">
              <label className="w-1/6 mt-3 px-1 text-xs">Location</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-3/4 rounded-md py-2 px-1 text-xs"
              />
              <label className="w-1/6 mt-3 px-1 text-xs">Designation</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-3/4 rounded-md py-2 px-1 text-xs"
              />
            </div>
            <div className="flex space-y-2">
              <label className="w-1/6 mt-3 px-1 text-xs">Section</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-3/4 rounded-md py-2 px-1 text-xs"
              />
              <label className="w-1/6 mt-3 px-1 text-xs">Department</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-3/4 rounded-md py-2 px-1 text-xs"
              />
            </div>
            <div className="flex space-y-2">
              <label className="w-1/6 mt-3 px-1 text-xs">Region</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-3/4 rounded-md py-2 px-1 text-xs"
              />
              <label className="w-1/6 mt-3 px-1 text-xs">Region</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-3/4 rounded-md py-2 px-1 text-xs"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded-md text-xs"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default ExpandableForm;

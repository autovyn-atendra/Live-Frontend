import { Checkbox } from 'antd';

const UserLevelPermissionSection = ({
  showper,
  userlevel,
  selectedPers,
  handleCheckboxChangePerv,
  handleSelectAllChangePers,
  togglePerVisibility,
}) => {
  return (
    <div className="relative  flex flex-col dark:bg-primary dark:bg-opacity-10 min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
      <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-3">
        <div className="text-center flex justify-between">
          <Checkbox
            className=" text-xl font-bold dark:text-white"
            indeterminate={
              selectedPers.length > 0 && selectedPers.length < userlevel.length
            }
            checked={selectedPers.length === userlevel.length}
            onChange={handleSelectAllChangePers}
          >
            Select All
          </Checkbox>
          <h6
            className=" text-xl font-bold cursor-pointer"
            onClick={togglePerVisibility}
          >
            User Level Permission
          </h6>
        </div>
      </div>
      {showper && (
        <div className="flex-auto px-8  lg:px-10 mt-2 py-10 pt-0 h-96 overflow-y-scroll ">
          {userlevel.map((level) => (
            <div key={level.Code}>
              <Checkbox
                key={level.Code}
                checked={selectedPers.includes(level.Code)}
                onChange={() => handleCheckboxChangePerv(level.Code)}
                className="dark:text-white font-semibold py-2"
              >
                {level.PermissionName}
              </Checkbox>
              <br />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserLevelPermissionSection;

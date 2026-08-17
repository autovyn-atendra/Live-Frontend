import React from "react";
import { Tree } from "antd";

const ModulesRightsSection = ({
  treeData,
  onCheck,
  onExpand,
  checkedKeys,
  expandedKeys,
  Title
}) => {
  return (
    <div className="relative  flex  flex-col dark:bg-primary dark:bg-opacity-10 min-w-0 break-words w-full pb-2  shadow-lg rounded-lg bg-blueGray-100 border-0">
      <div className="flex-auto px-8 lg:px-10 py-14 pt-0 h-screen overflow-y-scroll">
        <Tree
          showLine
          checkable
          onCheck={onCheck}
          onExpand={onExpand}
          checkedKeys={checkedKeys}
          expandedKeys={expandedKeys}
          treeData={treeData}
          className="bg-off bg-opacity-0 dark:text-white text-center items-center py-8 gap-4 font-semibold text-md uppercase"
        />
      </div>
      <div className="py-0.5"></div>
      <div className="py-5"></div>
    </div>
  );
};

export default ModulesRightsSection;

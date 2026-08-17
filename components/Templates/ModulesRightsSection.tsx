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
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <Tree
          showLine
          checkable
          onCheck={onCheck}
          onExpand={onExpand}
          checkedKeys={checkedKeys}
          expandedKeys={expandedKeys}
          treeData={treeData}
          className="bg-off bg-opacity-0 dark:text-white text-center items-center gap-4 font-semibold text-md uppercase"
        />
      </div>
    </div>
  );
};

export default ModulesRightsSection;
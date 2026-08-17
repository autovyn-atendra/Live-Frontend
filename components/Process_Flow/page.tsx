"use client";
import React from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import { motion } from 'framer-motion';
import 'reactflow/dist/style.css'; // Import React Flow styles
import { treeData } from '@/constant/modules';
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from '@/app/hooks/use-current-user';
import CustomNode from './CustomNode';

const findSubChildren = (tree, pathname, checkedKeys) => {
    for (const item of tree) {
        // If the current item's URL matches the pathname
        if (item.url === pathname) {
            // Check if any of the children’s keys are in checkedKeys
            const childrenToReturn = item.children?.filter(child => checkedKeys.includes(child.key));
            return childrenToReturn || []; // Return the filtered children, or empty array if no match
        }

        // If the item has children, recursively check them
        if (item.children) {
            const found = findSubChildren(item.children, pathname, checkedKeys);
            if (found.length > 0) return found; // Return the children if found
        }
    }
    return []; // Return empty if no children are found
};



const getHorizontalPosition = (index, totalNodes) => {
    const horizontalStep = 320;
    const verticalStep = 250;

    const row = Math.floor(index / 6);
    const col = index % 6;

    const xPos = col * horizontalStep;
    const yPos = row * verticalStep;

    return { x: xPos, y: yPos };
};

const generateEdges = (nodes) => {




    const oddNodes = nodes.filter((_, index) => index % 2 === 0);
    const evenNodes = nodes.filter((_, index) => index % 2 !== 0);

    const oddEdges = oddNodes.reduce((acc, _, index) => {
        if (index < oddNodes.length - 1) {
            const edge = {
                id: `e${oddNodes[index].key}-${oddNodes[index + 1].key}`,
                source: oddNodes[index].key,
                target: oddNodes[index + 1].key,
                animated: true,
                type: 'smoothstep',
                style: { stroke: '#3498db', strokeWidth: 6 },
                labelStyle: { fontSize: 20, fontWeight: '600', fill: '#000', textShadow: '1px 1px 2px #fff' },
                markerEnd: { type: 'arrowclosed', color: '#3498db' }
            };
            acc.push(edge);
        }
        return acc;
    }, []);

    const evenEdges = evenNodes.reduce((acc, _, index) => {
        if (index < evenNodes.length - 1) {
            const edge = {
                id: `e${evenNodes[index].key}-${evenNodes[index + 1].key}`,
                source: evenNodes[index].key,
                target: evenNodes[index + 1].key,
                animated: true,
                type: 'smoothstep',
                style: { stroke: '#3498db', strokeWidth: 6 },
                labelStyle: { fontSize: 20, fontWeight: '600', fill: '#000', textShadow: '1px 1px 2px #fff' },
                markerEnd: { type: 'arrowclosed', color: '#3498db' }
            };
            acc.push(edge);
        }
        return acc;
    }, []);

    if (oddNodes.length > 1 && evenNodes.length > 1) {
        const oddEdge = {
            id: `e${oddNodes[oddNodes.length - 1].key}-${evenNodes[evenNodes.length - 1].key}`,
            source: oddNodes[oddNodes.length - 1].key,
            target: evenNodes[evenNodes.length - 1].key,
            animated: true,
            type: 'smoothstep',
            style: { stroke: '#3498db', strokeWidth: 6 },
            labelStyle: { fontSize: 20, fontWeight: '600', fill: '#000', textShadow: '1px 1px 2px #fff' },
            markerEnd: { type: 'arrowclosed', color: '#3498db' }
        };
        oddEdges.push(oddEdge);

        const firstEdge = {
            id: `e${oddNodes[0].key}-${evenNodes[0].key}`,
            source: oddNodes[0].key,
            target: evenNodes[0].key,
            animated: true,
            type: 'smoothstep',
            style: { stroke: '#3498db', strokeWidth: 6 },
            labelStyle: { fontSize: 20, fontWeight: '600', fill: '#000', textShadow: '1px 1px 2px #fff' },
            markerEnd: { type: 'arrowclosed', color: '#3498db' }
        };
        oddEdges.push(firstEdge);
    }

    return [...oddEdges, ...evenEdges];
};
const nodeTypes = { customNode: CustomNode };
const DynamicFlow = () => {
    const user = useCurrentUser()
    const pathname = usePathname();
    const subChildren = findSubChildren(treeData, pathname, user?.role || []);
    console.log(subChildren, "subChildren")
    const router = useRouter()

    const nodes = subChildren.map((item, index) => ({
        id: item.key,
        data: { label: item.title?.replace(/\|/g, ''), url: item.url },
        type: "customNode",
        position: getHorizontalPosition(index, subChildren.length),
        style: {
            background: index % 2 === 0
                ? 'linear-gradient(90deg, #4CAF50, #81C784)'
                : 'linear-gradient(90deg, #FF9800, #FF5722)',
            color: '#fff',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.3)',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            width: '300px',
            height: '150px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center', // Center content horizontally
            alignItems: 'center',
        },
        component: (
            <motion.div
                initial={{ scale: 1 }}
                whileHover={{
                    scale: 1.2,
                    background: index % 2 === 0
                        ? 'linear-gradient(90deg, #388E3C, #66BB6A)' // Darker green on hover
                        : 'linear-gradient(90deg, #F57C00, #E64A19)', // Darker orange on hover
                    transition: { duration: 0.3 },
                }}
                whileTap={{ scale: 1, transition: { duration: 0.2 } }}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#fff',
                    textAlign: 'center',
                    cursor: 'pointer',
                }}
            >
                <div>{item.title?.replace(/\|/g, '')}</div>
            </motion.div>
        ),

    }));

    const onClickNode = (event, node) => {
        // Directly use node.data.url to navigate
        if (node.data.url) {
            router.push(node.data.url); // Navigate to the node's URL
        }
    };
    const edges = generateEdges(nodes);

    return (
        <div className='bg-white dark:bg-dark'>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} style={{ height: '75vh', width: '90vw' }} className='items-center justify-center text-center'>
                <div style={{ position: 'relative', width: '100%', height: '100%' }} className='items-center justify-center text-center'>
                    <ReactFlow
                        nodes={nodes.map((node) => ({
                            ...node,
                            data: {
                                label: node.data.label,
                                customNode: node.component, // Use motion component here
                                url: node.data.url
                            }
                        }))}
                        nodeTypes={nodeTypes}
                        onNodeClick={onClickNode}
                        edges={edges}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Controls />
                        <Background color="#888" gap={20} />
                    </ReactFlow>
                </div>
            </motion.div>
        </div>
    );
};

export default DynamicFlow;

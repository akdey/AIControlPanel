import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export const DeletableEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider stroke path for easy hover targeting */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
      />

      {/* Visible Edge Line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isHovered ? 3.5 : style.strokeWidth || 2,
          stroke: isHovered ? '#ef4444' : style.stroke || '#3b82f6',
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
        }}
      />

      {/* Hover Delete Button in middle of wire */}
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan z-50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteEdge(id);
              }}
              className="w-5.5 h-5.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl transition-all hover:scale-125 cursor-pointer border-2 border-slate-900"
              title="Click to delete connection edge"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
};

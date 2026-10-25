import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PriorityBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Clock, User, Building, GripVertical } from 'lucide-react';

export default function KanbanBoard({ cases, onDragEnd, onCaseClick }) {
  const { user } = useAuth();

  const stages = [
    { id: 'Filed', label: '1. Filed', accent: 'border-t-slate-500' },
    { id: 'Under Investigation', label: '2. Under Investigation', accent: 'border-t-blue-500' },
    { id: 'Warrant Issued', label: '3. Warrant Issued', accent: 'border-t-amber-500' },
    { id: 'In Court', label: '4. In Court', accent: 'border-t-purple-500' },
    { id: 'Closed', label: '5. Closed / Cold', accent: 'border-t-emerald-500' },
  ];

  const isDragDisabled = user?.role === 'Evidence-Manager';

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 min-h-[580px] select-none">
        {stages.map((stage) => {
          const stageCases = cases.filter((c) =>
            stage.id === 'Closed'
              ? c.case_status === 'Closed' || c.case_status === 'Cold'
              : c.case_status === stage.id
          );

          return (
            <div
              key={stage.id}
              className={`bg-hq-card border border-hq-border border-t-2 ${stage.accent} rounded-xl p-3 flex flex-col shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-hq-border">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide truncate">
                  {stage.label}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono font-bold">
                  {stageCases.length}
                </span>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2.5 flex-1 min-h-[120px] rounded-lg transition-colors p-1 ${
                      snapshot.isDraggingOver ? 'bg-blue-950/20 ring-1 ring-blue-500/30' : ''
                    }`}
                  >
                    {stageCases.map((c, index) => {
                      const isDraggableForUser =
                        !isDragDisabled &&
                        (user?.role === 'System-Admin' ||
                          user?.role === 'Head-Officer' ||
                          String(c.station_id) === String(user?.station_id));

                      return (
                        <Draggable
                          key={String(c.id)}
                          draggableId={String(c.id)}
                          index={index}
                          isDragDisabled={!isDraggableForUser}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`p-3 bg-slate-900/90 border rounded-lg text-xs shadow transition group ${
                                dragSnapshot.isDragging
                                  ? 'border-blue-400 bg-slate-900 shadow-2xl scale-[1.02]'
                                  : 'border-slate-800 hover:border-blue-500/60'
                              } ${!isDraggableForUser ? 'cursor-pointer' : 'cursor-grab'}`}
                              onClick={() => onCaseClick(c)}
                            >
                              {/* Header: Case # & Priority */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center space-x-1.5">
                                  {isDraggableForUser && (
                                    <div
                                      {...dragProvided.dragHandleProps}
                                      className="text-slate-600 group-hover:text-slate-400 cursor-grab"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                  <span className="font-mono font-bold text-white group-hover:text-blue-400 transition">
                                    {c.case_number}
                                  </span>
                                </div>
                                <PriorityBadge priority={c.priority} />
                              </div>

                              {/* Title / Crime */}
                              <p className="text-slate-200 font-medium line-clamp-1 mb-1">
                                {c.crime_type}
                              </p>

                              {/* Station Tag */}
                              <p className="text-[10px] text-blue-400 truncate">
                                {c.station_name}
                              </p>

                              {/* Footer: Officer & Days Active */}
                              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-hq-muted">
                                <span className="truncate max-w-[110px]">
                                  {c.assigned_officer_name || 'Unassigned'}
                                </span>
                                <span className="font-mono text-slate-400 shrink-0">
                                  {c.days_active}d active
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {stageCases.length === 0 && !snapshot.isDraggingOver && (
                      <div className="py-8 text-center border border-dashed border-slate-800/80 rounded-lg">
                        <p className="text-[11px] text-slate-600">No cases in this stage</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}


"use client";

import * as React from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Trash2 } from "lucide-react";
import type { ImageFile } from "@/app/pdf-tools/page";

interface ImageDropzoneProps {
    imageFiles: ImageFile[];
    setImageFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>;
}

export function ImageDropzone({ imageFiles, setImageFiles }: ImageDropzoneProps) {
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(imageFiles);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setImageFiles(items);
    };

    const handleRemoveImage = (id: string) => {
        setImageFiles(prev => prev.filter(image => image.id !== id));
    };

    const handleRotateImage = (id: string) => {
        setImageFiles(prev =>
            prev.map(image =>
                image.id === id
                    ? { ...image, rotation: (image.rotation + 90) % 360 }
                    : image
            )
        );
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="image-list" direction="horizontal">
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                    >
                        {imageFiles.map((image, index) => (
                            <Draggable key={image.id} draggableId={image.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <Card className="group relative aspect-[3/4] overflow-hidden">
                                            <img
                                                src={image.previewUrl}
                                                alt={`preview ${index}`}
                                                className="h-full w-full object-cover transition-transform"
                                                style={{ transform: `rotate(${image.rotation}deg)` }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button variant="default" size="icon" onClick={() => handleRotateImage(image.id)}>
                                                    <RotateCw className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="icon" onClick={() => handleRemoveImage(image.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="absolute top-1 left-1 bg-black/50 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}

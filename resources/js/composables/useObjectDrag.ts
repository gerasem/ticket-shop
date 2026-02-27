import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import type { Venue } from '../types/venue';
import type { VenueObject } from '../types/venueObjects';
import { OBJECT_TEMPLATES } from '../types/venueObjects';
import { type Point } from './useGeometry';

export function useObjectDrag(venueRef: Ref<Venue | null>, commit: () => void) {
  const selectedObjectId = ref<string | null>(null);
  const isDraggingObject = ref(false);
  const objectDragStart = ref<Point>({ x: 0, y: 0 });

  const getSelectedObject = computed(() => {
    if (!selectedObjectId.value || !venueRef.value) return null;
    return venueRef.value.objects?.find(o => o.id === selectedObjectId.value) || null;
  });

  const addObjectFromTemplate = (templateType: VenueObject['type'], x = 100, y = 100) => {
    if (!venueRef.value) return;
    const template = OBJECT_TEMPLATES.find(t => t.type === templateType);
    if (!template) return;

    const newObject: VenueObject = {
      id: `object-${Date.now()}`,
      type: templateType,
      x,
      y,
      width: template.defaultWidth,
      height: template.defaultHeight,
      rotation: 0,
      label: template.label,
      attachedSeatIds: []
    };

    if (!venueRef.value.objects) {
      venueRef.value.objects = [];
    }
    venueRef.value.objects.push(newObject);
    selectedObjectId.value = newObject.id;
    commit();
  };

  const selectObject = (objectId: string) => {
    selectedObjectId.value = objectId;
  };

  const deselectObject = () => {
    selectedObjectId.value = null;
  };

  const startObjectDrag = (objectId: string, event: MouseEvent) => {
    selectedObjectId.value = objectId;
    isDraggingObject.value = true;
    objectDragStart.value = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  };

  const handleObjectDragMove = (event: MouseEvent) => {
    if (!isDraggingObject.value || !selectedObjectId.value || !venueRef.value) return;
    const dx = event.clientX - objectDragStart.value.x;
    const dy = event.clientY - objectDragStart.value.y;
    const object = venueRef.value.objects?.find(o => o.id === selectedObjectId.value);
    if (object) {
      object.x += dx;
      object.y += dy;
    }
    objectDragStart.value = { x: event.clientX, y: event.clientY };
  };

  const endObjectDrag = () => {
    if (isDraggingObject.value) commit();
    isDraggingObject.value = false;
  };

  const deleteSelectedObject = () => {
    if (!selectedObjectId.value || !venueRef.value) return;
    venueRef.value.objects = venueRef.value.objects?.filter(
      o => o.id !== selectedObjectId.value
    );
    selectedObjectId.value = null;
    commit();
  };

  const updateObjectProperty = (property: keyof VenueObject, value: unknown) => {
    if (!selectedObjectId.value || !venueRef.value) return;
    const object = venueRef.value.objects?.find(o => o.id === selectedObjectId.value);
    if (object) {
      (object as unknown as Record<string, unknown>)[property as string] = value;
    }
    commit();
  };

  const moveSelectedObject = (dx: number, dy: number, step = 10) => {
    if (!selectedObjectId.value || !venueRef.value) return;
    const object = venueRef.value.objects?.find(o => o.id === selectedObjectId.value);
    if (object) {
      object.x += dx * step;
      object.y += dy * step;
    }
  };

  return {
    selectedObjectId,
    isDraggingObject,
    getSelectedObject,
    addObjectFromTemplate,
    selectObject,
    deselectObject,
    startObjectDrag,
    handleObjectDragMove,
    endObjectDrag,
    deleteSelectedObject,
    updateObjectProperty,
    moveSelectedObject,
  };
}

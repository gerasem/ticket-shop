import { onMounted, onUnmounted, type Ref } from 'vue';

export interface KeyboardControlsOptions {
  // Условие для активации обработчика
  enabled: Ref<boolean>;
  
  // Callback для обработки стрелок (dx, dy)
  onArrowKey?: (dx: number, dy: number) => void;
  
  // Callback для обработки Delete/Backspace
  onDelete?: () => void;
  
  // Опционально: дополнительные кастомные обработчики
  customHandlers?: Record<string, (event: KeyboardEvent) => void>;
}

/**
 * Composable для управления клавиатурными событиями
 * Автоматически подписывается/отписывается от событий клавиатуры
 */
export function useKeyboardControls(options: KeyboardControlsOptions) {
  const { enabled, onArrowKey, onDelete, customHandlers } = options;

  const handleKeydown = (event: KeyboardEvent) => {
    // Не обрабатываем события если обработчик отключен
    if (!enabled.value) return;

    // Предотвращаем стандартное поведение для стрелок
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }

    // Обработка стрелок
    if (onArrowKey) {
      switch (event.key) {
        case 'ArrowUp':
          onArrowKey(0, -1);
          return;
        case 'ArrowDown':
          onArrowKey(0, 1);
          return;
        case 'ArrowLeft':
          onArrowKey(-1, 0);
          return;
        case 'ArrowRight':
          onArrowKey(1, 0);
          return;
      }
    }

    // Обработка Delete/Backspace
    if (onDelete && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault(); // Prevent browser back navigation
      onDelete();
      return;
    }

    // Обработка кастомных клавиш
    if (customHandlers && event.key in customHandlers) {
      const handler = customHandlers[event.key];
      if (handler) {
        handler(event);
      }
    }
  };

  // Подписка на события при монтировании
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  // Отписка от событий при размонтировании
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
}

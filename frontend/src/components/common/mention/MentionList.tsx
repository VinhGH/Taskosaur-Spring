import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import UserAvatar from '@/components/ui/avatars/UserAvatar';

export interface MentionNode {
  id: string;
  label: string;
  avatar?: string;
  email?: string;
}

export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items || props.items.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a1b1e] shadow-lg border border-[var(--border)] rounded-md py-2 px-3 text-sm text-[var(--muted-foreground)]">
        No members found
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a1b1e] shadow-lg border border-[var(--border)] rounded-md overflow-hidden min-w-[200px] z-50">
      {props.items.map((item: MentionNode, index: number) => (
        <button
          className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors ${
            index === selectedIndex 
              ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' 
              : 'hover:bg-[var(--muted)] text-[var(--foreground)]'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          <UserAvatar 
            user={{ 
              firstName: item.label.split(' ')[0], 
              lastName: item.label.split(' ')[1] || '',
              avatar: item.avatar 
            }} 
            size="xs" 
          />
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';

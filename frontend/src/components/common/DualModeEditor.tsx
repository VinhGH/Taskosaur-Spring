"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  HiBold,
  HiItalic,
  HiUnderline,
  HiStrikethrough,
  HiOutlineListBullet,
  HiCodeBracket,
  HiCodeBracketSquare,
  HiDocumentText,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { List, Quote } from "lucide-react";
import { toast } from "sonner";
import {
  handleImageUpload,
  generateUploadPlaceholderId,
  isUploadingPlaceholder,
  IMAGE_UPLOAD_CONFIG,
} from "@/lib/image-upload";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export type EditorMode = "markdown" | "richtext";

const EDITOR_MODE_STORAGE_KEY = "taskosaur_comment_editor_mode";

// Track ongoing uploads by placeholder ID
const ongoingUploads = new Map<string, boolean>();

// Inline styles configuration
const INLINE_STYLES = [
  { icon: <HiBold className="size-4" />, style: "BOLD", tooltip: "Bold (Ctrl+B)" },
  { icon: <HiItalic className="size-4" />, style: "ITALIC", tooltip: "Italic (Ctrl+I)" },
  { icon: <HiUnderline className="size-4" />, style: "UNDERLINE", tooltip: "Underline (Ctrl+U)" },
  { icon: <HiStrikethrough className="size-4" />, style: "STRIKETHROUGH", tooltip: "Strikethrough" },
] as const;

// Block types configuration
const BLOCK_TYPES = [
  { icon: <span className="text-xs font-semibold">H1</span>, style: "header-one", tooltip: "Heading 1" },
  { icon: <span className="text-xs font-semibold">H2</span>, style: "header-two", tooltip: "Heading 2" },
  { icon: <span className="text-xs font-semibold">H3</span>, style: "header-three", tooltip: "Heading 3" },
  { icon: <HiOutlineListBullet className="size-4" />, style: "unordered-list-item", tooltip: "Bullet List" },
  { icon: <List className="size-4" />, style: "ordered-list-item", tooltip: "Numbered List" },
  { icon: <Quote className="size-4" />, style: "blockquote", tooltip: "Quote" },
  { icon: <HiCodeBracket className="size-4" />, style: "code-block", tooltip: "Code Block" },
] as const;

interface DualModeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  colorMode?: "light" | "dark";
  disabled?: boolean;
  onModeChange?: (mode: EditorMode) => void;
}

/**
 * Get stored editor mode preference from localStorage
 */
function getStoredEditorMode(): EditorMode {
  if (typeof window === "undefined") return "markdown";
  try {
    const stored = localStorage.getItem(EDITOR_MODE_STORAGE_KEY);
    if (stored === "markdown" || stored === "richtext") {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }
  return "markdown";
}

/**
 * Save editor mode preference to localStorage
 */
function saveEditorMode(mode: EditorMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EDITOR_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Convert markdown to HTML (basic conversion for switching modes)
 */
function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    // Strikethrough
    .replace(/~~(.*?)~~/g, "<del>$1</del>")
    // Code blocks
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    // Inline code
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // Unordered lists
    .replace(/^\s*[-*+]\s+(.*$)/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*$)/gm, "<li>$1</li>")
    // Blockquotes
    .replace(/^>\s*(.*$)/gm, "<blockquote>$1</blockquote>")
    // Line breaks
    .replace(/\n/g, "<br>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(\s*<br>)?)+/g, (match) => {
    const items = match.replace(/<br>/g, "");
    return `<ul>${items}</ul>`;
  });

  // Clean up extra <br> tags
  html = html.replace(/<br><br>/g, "</p><p>");

  if (!html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }

  return html;
}

/**
 * Convert HTML to markdown (basic conversion for switching modes)
 */
function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let markdown = html
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n")
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n")
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n")
    // Bold
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, "**$2**")
    // Italic
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, "*$2*")
    // Strikethrough
    .replace(/<(del|s|strike)[^>]*>(.*?)<\/(del|s|strike)>/gi, "~~$2~~")
    // Code blocks
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```")
    // Inline code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    // List items
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    // Remove ul/ol wrappers
    .replace(/<\/?[uo]l[^>]*>/gi, "")
    // Blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n")
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    // Paragraphs and line breaks
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Remove remaining HTML tags (potential incomplete multi-character sanitization) repeatedly
  let previous;
  do {
    previous = markdown;
    markdown = markdown.replace(/<[^>]+>/g, "");
  } while (markdown !== previous);

  // Clean up extra whitespace
  markdown = markdown
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return markdown;
}

// Rich text editor inner component (loaded only on client)
interface RichTextEditorInnerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  height: number;
  disabled: boolean;
}

function RichTextEditorInner({
  value,
  onChange,
  placeholder,
  height,
  disabled,
}: RichTextEditorInnerProps) {
  // Import draft-js modules dynamically
  const [draftModules, setDraftModules] = useState<{
    Editor: typeof import("draft-js").Editor;
    EditorState: typeof import("draft-js").EditorState;
    RichUtils: typeof import("draft-js").RichUtils;
    ContentState: typeof import("draft-js").ContentState;
    convertToRaw: typeof import("draft-js").convertToRaw;
    DefaultDraftBlockRenderMap: typeof import("draft-js").DefaultDraftBlockRenderMap;
    AtomicBlockUtils: typeof import("draft-js").AtomicBlockUtils;
    draftToHtml: typeof import("draftjs-to-html").default;
    htmlToDraft: typeof import("html-to-draftjs").default;
  } | null>(null);

  const [editorState, setEditorState] = useState<import("draft-js").EditorState | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastEmittedValue = useRef<string>(value);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load draft-js modules on mount
  useEffect(() => {
    async function loadModules() {
      const [draftJs, draftToHtmlMod, htmlToDraftMod] = await Promise.all([
        import("draft-js"),
        import("draftjs-to-html"),
        import("html-to-draftjs"),
      ]);

      setDraftModules({
        Editor: draftJs.Editor,
        EditorState: draftJs.EditorState,
        RichUtils: draftJs.RichUtils,
        ContentState: draftJs.ContentState,
        convertToRaw: draftJs.convertToRaw,
        DefaultDraftBlockRenderMap: draftJs.DefaultDraftBlockRenderMap,
        AtomicBlockUtils: draftJs.AtomicBlockUtils,
        draftToHtml: draftToHtmlMod.default,
        htmlToDraft: htmlToDraftMod.default,
      });
    }
    loadModules();
  }, []);

  // Initialize editor state when modules are loaded
  useEffect(() => {
    if (draftModules && !editorState) {
      if (value) {
        try {
          const contentBlock = draftModules.htmlToDraft(value);
          if (contentBlock) {
            const contentState = draftModules.ContentState.createFromBlockArray(
              contentBlock.contentBlocks
            );
            setEditorState(draftModules.EditorState.createWithContent(contentState));
            lastEmittedValue.current = value;
          } else {
            setEditorState(draftModules.EditorState.createEmpty());
          }
        } catch {
          setEditorState(draftModules.EditorState.createEmpty());
        }
      } else {
        setEditorState(draftModules.EditorState.createEmpty());
      }
    }
  }, [draftModules, value, editorState]);
  // Handle external value updates (e.g. switching to edit mode, or clearing after submit)
  useEffect(() => {
    if (draftModules && editorState && value !== lastEmittedValue.current) {
      try {
        const contentBlock = draftModules.htmlToDraft(value);
        if (contentBlock) {
          const contentState = draftModules.ContentState.createFromBlockArray(
            contentBlock.contentBlocks
          );
          setEditorState(draftModules.EditorState.createWithContent(contentState));
          lastEmittedValue.current = value;
        }
      } catch (e) {
        // Fallback for invalid HTML
        console.error("Failed to parse HTML for editor update", e);
      }
    }
  }, [value, draftModules, editorState]);

  const handleEditorChange = useCallback(
    (newState: import("draft-js").EditorState) => {
      if (!draftModules) return;
      setEditorState(newState);
      const rawContent = draftModules.convertToRaw(newState.getCurrentContent());
      const html = draftModules.draftToHtml(rawContent);
      const plainText = newState.getCurrentContent().getPlainText();
      
      let newValue = "";
      if (plainText.trim() || html !== "<p></p>\n") {
        newValue = html;
      }
      
      lastEmittedValue.current = newValue;
      onChange(newValue);
    },
    [draftModules, onChange]
  );

  const toggleInlineStyle = useCallback(
    (style: string) => {
      if (!draftModules || !editorState) return;
      handleEditorChange(draftModules.RichUtils.toggleInlineStyle(editorState, style));
    },
    [draftModules, editorState, handleEditorChange]
  );

  const toggleBlockType = useCallback(
    (blockType: string) => {
      if (!draftModules || !editorState) return;
      handleEditorChange(draftModules.RichUtils.toggleBlockType(editorState, blockType));
    },
    [draftModules, editorState, handleEditorChange]
  );

  const handleKeyCommand = useCallback(
    (command: string): "handled" | "not-handled" => {
      if (!draftModules || !editorState) return "not-handled";
      const newState = draftModules.RichUtils.handleKeyCommand(editorState, command);
      if (newState) {
        handleEditorChange(newState);
        return "handled";
      }
      return "not-handled";
    },
    [draftModules, editorState, handleEditorChange]
  );

  // Handle image upload for rich text editor
  const handleRichTextImageUpload = useCallback(async (file: File) => {
    if (!draftModules || !editorState) return;

    const placeholderId = generateUploadPlaceholderId();
    const placeholderHtml = `<div class="image-upload-placeholder" data-upload-id="${placeholderId}">🔄 Uploading image...</div>`;
    
    // Mark upload as in progress
    ongoingUploads.set(placeholderId, true);
    
    // Insert placeholder at current cursor position as HTML
    const currentHtml = draftModules.draftToHtml(draftModules.convertToRaw(editorState.getCurrentContent()));
    const selection = editorState.getSelection();
    const plainText = editorState.getCurrentContent().getPlainText();
    const cursorPos = selection.getStartOffset();
    
    // Insert placeholder HTML at cursor position
    const beforeHtml = plainText.substring(0, cursorPos);
    const afterHtml = plainText.substring(cursorPos);
    const newHtml = beforeHtml + placeholderHtml + afterHtml;
    
    // Convert back to draft content and update
    const contentBlock = draftModules.htmlToDraft(newHtml);
    if (contentBlock) {
      const newContentState = draftModules.ContentState.createFromBlockArray(contentBlock.contentBlocks);
      const newEditorState = draftModules.EditorState.createWithContent(newContentState);
      setEditorState(newEditorState);
      onChange(newHtml);
    }

    // Upload image
    const imageUrl = await handleImageUpload(file, {
      onProgress: (progress) => {
        if (ongoingUploads.has(placeholderId)) {
          // Could update placeholder with progress
        }
      },
      showToasts: false,
    });

    // Remove from ongoing uploads
    ongoingUploads.delete(placeholderId);

    if (imageUrl) {
      // Replace placeholder with actual image
      const finalHtml = newHtml.replace(placeholderHtml, `<img src="${imageUrl}" alt="${file.name}" />`);
      
      // Update editor with final HTML
      const contentBlock = draftModules.htmlToDraft(finalHtml);
      if (contentBlock) {
        const finalContentState = draftModules.ContentState.createFromBlockArray(
          contentBlock.contentBlocks
        );
        const finalEditorState = draftModules.EditorState.createWithContent(finalContentState);
        setEditorState(finalEditorState);
        onChange(finalHtml);
        toast.success("Image uploaded successfully", { description: file.name });
      }
    } else {
      // Remove placeholder on failure
      const finalHtml = newHtml.replace(placeholderHtml, '');
      
      const contentBlock = draftModules.htmlToDraft(finalHtml);
      if (contentBlock) {
        const finalContentState = draftModules.ContentState.createFromBlockArray(
          contentBlock.contentBlocks
        );
        const finalEditorState = draftModules.EditorState.createWithContent(finalContentState);
        setEditorState(finalEditorState);
        onChange(finalHtml);
        toast.error("Image upload failed", { description: file.name });
      }
    }
  }, [draftModules, editorState, onChange]);

  // Handle paste events in rich text editor
  const handleRichTextPaste = useCallback(async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    const imageFiles: File[] = [];

    // Extract image files from clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    // If we have image files, handle the upload
    if (imageFiles.length > 0) {
      event.preventDefault();
      
      // Upload each image
      for (const file of imageFiles) {
        await handleRichTextImageUpload(file);
      }
    }
  }, [handleRichTextImageUpload]);

  // Handle drag and drop in rich text editor
  const handleRichTextDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file): file is File => 
      IMAGE_UPLOAD_CONFIG.allowedTypes.includes(file.type as any)
    );

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        await handleRichTextImageUpload(file);
      }
    }
  }, [handleRichTextImageUpload]);

  // Handle drag over
  const handleRichTextDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drag leave
  const handleRichTextDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Handle file input change for rich text
  const handleRichTextFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!IMAGE_UPLOAD_CONFIG.allowedTypes.includes(file.type as any)) {
      toast.error("Invalid file type", { 
        description: "Only JPEG, PNG, GIF, and WebP images are allowed." 
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    await handleRichTextImageUpload(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleRichTextImageUpload]);

  // Trigger file input click for rich text
  const handleRichTextImageButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const blockStyleFn = useCallback((block: import("draft-js").ContentBlock) => {
    switch (block.getType()) {
      case "header-one":
        return "text-2xl font-bold my-2";
      case "header-two":
        return "text-xl font-semibold my-2";
      case "header-three":
        return "text-lg font-semibold my-1";
      case "header-four":
        return "text-base font-medium my-1";
      case "header-five":
        return "text-sm font-medium my-1";
      case "header-six":
        return "text-xs font-medium my-1";
      case "blockquote":
        return "border-l-4 border-[var(--border)] pl-4 italic text-[var(--muted-foreground)] my-2";
      case "unordered-list-item":
        return "list-disc ml-5 my-1";
      case "ordered-list-item":
        return "list-decimal ml-5 my-1";
      case "code-block":
        return "bg-[var(--muted)] font-mono p-2 rounded my-1 text-sm";
      default:
        return "";
    }
  }, []);

  // Show loading state while modules are loading
  if (!draftModules || !editorState) {
    return (
      <div
        className="rounded-md border border-[var(--border)] bg-[var(--background)] flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-[var(--muted-foreground)] text-sm">Loading...</span>
      </div>
    );
  }

  const currentInlineStyle = editorState.getCurrentInlineStyle();
  const selection = editorState.getSelection();
  const currentBlockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  const { Editor } = draftModules;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--background)] overflow-hidden">
      {/* Rich Text Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-[var(--border)] bg-[var(--muted)]/30">
        {INLINE_STYLES.map((style) => (
          <button
            key={style.tooltip}
            type="button"
            title={style.tooltip}
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleInlineStyle(style.style);
            }}
            className={`p-1.5 rounded transition-colors ${
              currentInlineStyle.has(style.style)
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {style.icon}
          </button>
        ))}

        <span className="w-px h-5 bg-[var(--border)] mx-1" />

        {BLOCK_TYPES.map((block) => (
          <button
            key={block.tooltip}
            type="button"
            title={block.tooltip}
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlockType(block.style);
            }}
            className={`p-1.5 rounded transition-colors ${
              currentBlockType === block.style
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {block.icon}
          </button>
        ))}

        <span className="w-px h-5 bg-[var(--border)] mx-1" />

        {/* Image Upload Button */}
        <button
          type="button"
          title="Upload image"
          disabled={disabled}
          onClick={handleRichTextImageButtonClick}
          className={`p-1.5 rounded transition-colors text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <HiOutlinePhoto className="size-4" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_UPLOAD_CONFIG.allowedTypes.join(',')}
          onChange={handleRichTextFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Draft.js Editor */}
      <div
        ref={editorRef}
        className="px-3 py-2 overflow-y-auto cursor-text text-sm relative"
        style={{ height: height - 45 }}
        onClick={() => {
          editorRef.current?.querySelector<HTMLElement>(".DraftEditor-root")?.click();
        }}
        onPaste={handleRichTextPaste}
        onDrop={handleRichTextDrop}
        onDragOver={handleRichTextDragOver}
        onDragLeave={handleRichTextDragLeave}
      >
        {/* Drop zone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-md flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
              <HiOutlinePhoto className="size-6 mx-auto mb-1 text-blue-500" />
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Drop image to upload</p>
            </div>
          </div>
        )}
        
        <Editor
          editorState={editorState}
          onChange={handleEditorChange}
          placeholder={placeholder}
          handleKeyCommand={handleKeyCommand}
          blockStyleFn={blockStyleFn}
          readOnly={disabled}
        />
      </div>
    </div>
  );
}

export default function DualModeEditor({
  value,
  onChange,
  placeholder = "Write your comment...",
  height = 200,
  colorMode = "light",
  disabled = false,
  onModeChange,
}: DualModeEditorProps) {
  const [mode, setMode] = useState<EditorMode>("markdown");
  const [markdownValue, setMarkdownValue] = useState<string>("");
  const [richTextValue, setRichTextValue] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    const storedMode = getStoredEditorMode();
    setMode(storedMode);
    onModeChange?.(storedMode);
  }, []);

  // Initialize editor with the provided value and handle external updates
  useEffect(() => {
    if (isMounted) {
      // Only update if the value has actually changed from what we have stored
      // This prevents loops when the update comes from the editor itself
      const currentStoredValue = mode === "markdown" ? markdownValue : richTextValue;
      
      // If the incoming value is different from what we have, update our state
      // We also update if we haven't initialized yet
      if (!isInitialized || value !== currentStoredValue) {
        if (value) {
          // Detect if value is HTML or markdown
          const isHtml = /<[a-z][\s\S]*>/i.test(value);

          if (mode === "markdown") {
            setMarkdownValue(isHtml ? htmlToMarkdown(value) : value);
            setRichTextValue(isHtml ? value : markdownToHtml(value));
          } else {
            setRichTextValue(isHtml ? value : markdownToHtml(value));
            setMarkdownValue(isHtml ? htmlToMarkdown(value) : value);
          }
        } else if (!isInitialized) {
          // Only reset to empty on init, otherwise we might wipe user input
          // if the parent passes empty string temporarily
          setMarkdownValue("");
          setRichTextValue("");
        } else if (value === "") {
           // Explicit clear from parent
           setMarkdownValue("");
           setRichTextValue("");
        }
        
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    }
  }, [value, mode, isInitialized, isMounted]);

  // Handle mode switching
  const handleModeSwitch = useCallback(
    (newMode: EditorMode) => {
      if (newMode === mode) return;

      if (newMode === "markdown") {
        // Convert rich text to markdown
        const markdown = htmlToMarkdown(richTextValue);
        setMarkdownValue(markdown);
        onChange(markdown);
      } else {
        // Convert markdown to rich text
        const html = markdownToHtml(markdownValue);
        setRichTextValue(html);
        onChange(html);
      }

      setMode(newMode);
      saveEditorMode(newMode);
      onModeChange?.(newMode);
    },
    [mode, richTextValue, markdownValue, onChange, onModeChange]
  );

  // Handle markdown editor change
  const handleMarkdownChange = useCallback(
    (val: string | undefined) => {
      const newValue = val || "";
      setMarkdownValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  // Handle image upload and insert into markdown editor
  const handleImageUploadAndInsert = useCallback(async (file: File) => {
    const placeholderId = generateUploadPlaceholderId();
    const placeholderText = `![Uploading image...](uploading:${placeholderId})`;
    
    // Mark upload as in progress
    ongoingUploads.set(placeholderId, true);
    
    // Try to get cursor position from textarea, fallback to appending
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    let startPos = 0;
    let endPos = 0;
    
    if (textarea) {
      startPos = textarea.selectionStart;
      endPos = textarea.selectionEnd;
    }
    
    // Insert placeholder at cursor position or append
    const beforeText = markdownValue.substring(0, startPos);
    const afterText = markdownValue.substring(endPos);
    const needsNewlineBefore = beforeText.length > 0 && !beforeText.endsWith('\n');
    const needsNewlineAfter = afterText.length > 0 && !afterText.startsWith('\n');
    const newText = beforeText + (needsNewlineBefore ? '\n' : '') + placeholderText + (needsNewlineAfter ? '\n' : '') + afterText;
    
    setMarkdownValue(newText);
    onChange(newText);

    // Upload image
    const imageUrl = await handleImageUpload(file, {
      onProgress: (progress) => {
        // Optional: Update placeholder with progress
        if (ongoingUploads.has(placeholderId)) {
          const progressText = `![Uploading image... ${progress}%](uploading:${placeholderId})`;
          const updatedText = newText.replace(placeholderText, progressText);
          setMarkdownValue(updatedText);
          onChange(updatedText);
        }
      },
      showToasts: false,
    });

    // Remove from ongoing uploads
    ongoingUploads.delete(placeholderId);

    if (imageUrl) {
      // Replace placeholder with actual image markdown
      const finalText = newText.replace(placeholderText, `![${file.name}](${imageUrl})`);
      setMarkdownValue(finalText);
      onChange(finalText);
      toast.success("Image uploaded successfully", { description: file.name });
    } else {
      // Remove placeholder on failure
      const finalText = newText.replace(placeholderText, '').replace(/\n\n/g, '\n');
      setMarkdownValue(finalText);
      onChange(finalText);
      toast.error("Image upload failed", { description: file.name });
    }
  }, [markdownValue, onChange]);

  // Handle file input change
  const handleFileInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!IMAGE_UPLOAD_CONFIG.allowedTypes.includes(file.type as any)) {
      toast.error("Invalid file type", { 
        description: "Only JPEG, PNG, GIF, and WebP images are allowed." 
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    await handleImageUploadAndInsert(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUploadAndInsert]);

  // Trigger file input click
  const handleImageButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Attach paste and drop listeners to the markdown editor
  useEffect(() => {
    if (!isMounted || mode !== 'markdown') return;

    const editorContainer = document.querySelector('.task-md-editor');
    if (!editorContainer) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        for (const file of imageFiles) {
          await handleImageUploadAndInsert(file);
        }
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter((file): file is File => 
        IMAGE_UPLOAD_CONFIG.allowedTypes.includes(file.type as any)
      );

      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          await handleImageUploadAndInsert(file);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    editorContainer.addEventListener('paste', handlePaste);
    editorContainer.addEventListener('drop', handleDrop);
    editorContainer.addEventListener('dragover', handleDragOver);
    editorContainer.addEventListener('dragleave', handleDragLeave);
    
    return () => {
      editorContainer.removeEventListener('paste', handlePaste);
      editorContainer.removeEventListener('drop', handleDrop);
      editorContainer.removeEventListener('dragover', handleDragOver);
      editorContainer.removeEventListener('dragleave', handleDragLeave);
    };
  }, [isMounted, mode, handleImageUploadAndInsert]);

  // Handle rich text editor change
  const handleRichTextChange = useCallback(
    (val: string) => {
      setRichTextValue(val);
      onChange(val);
    },
    [onChange]
  );

  // Show loading state during SSR
  if (!isMounted) {
    return (
      <div
        className="rounded-md border border-[var(--border)] bg-[var(--background)] flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-[var(--muted-foreground)] text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="dual-mode-editor">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2 mb-2">
        <div className="inline-flex items-center p-0.5 bg-[var(--muted)]/50 rounded-md">
          <button
            type="button"
            onClick={() => handleModeSwitch("markdown")}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              mode === "markdown"
                ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <HiCodeBracketSquare className="size-3.5" />
            Markdown
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("richtext")}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              mode === "richtext"
                ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <HiDocumentText className="size-3.5" />
            Rich Text
          </button>
        </div>
        <span className="text-[10px] text-[var(--muted-foreground)]">
          {mode === "markdown" ? "Supports GFM" : "WYSIWYG"}
        </span>
      </div>

      {/* Editor Content */}
      {mode === "markdown" ? (
        <div
          data-color-mode={colorMode}
          className="task-md-editor relative"
        >
          {/* Custom Image Upload Button */}
          <div className="flex items-center gap-1 p-1 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <button
              type="button"
              onClick={handleImageButtonClick}
              disabled={disabled}
              title="Upload image"
              className={`p-1.5 rounded transition-colors text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <HiOutlinePhoto className="size-4" />
            </button>
            <span className="text-[10px] text-[var(--muted-foreground)] ml-2">
              Paste or drag images to upload
            </span>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_UPLOAD_CONFIG.allowedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          {/* Drop zone overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-md flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
                <HiOutlinePhoto className="size-6 mx-auto mb-1 text-blue-500" />
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Drop image to upload</p>
              </div>
            </div>
          )}
          
          <MDEditor
            value={markdownValue}
            onChange={handleMarkdownChange}
            preview="edit"
            hideToolbar={false}
            height={height}
            textareaProps={{
              placeholder,
              disabled,
            }}
            visibleDragbar={false}
          />
        </div>
      ) : (
        <RichTextEditorInner
          value={richTextValue}
          onChange={handleRichTextChange}
          placeholder={placeholder}
          height={height}
          disabled={disabled}
        />
      )}
    </div>
  );
}

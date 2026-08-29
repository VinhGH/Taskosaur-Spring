import { toast } from "sonner";
import i18n from "./i18n";

type SupportedLang = "vi" | "en" | "es" | "fr" | "pt" | "de";

/**
 * Toast dictionary mapping normalized phrases to all supported languages.
 */
const TOAST_DICTIONARY: Record<string, Record<SupportedLang, string>> = {
  // --- Tasks ---
  "task created successfully": {
    vi: "Tạo công việc thành công",
    en: "Task created successfully",
    es: "Tarea creada con éxito",
    fr: "Tâche créée avec succès",
    pt: "Tarefa criada com sucesso",
    de: "Aufgabe erfolgreich erstellt",
  },
  "task updated successfully": {
    vi: "Cập nhật công việc thành công",
    en: "Task updated successfully",
    es: "Tarea actualizada con éxito",
    fr: "Tâche mise à jour avec succès",
    pt: "Tarefa atualizada com sucesso",
    de: "Aufgabe erfolgreich aktualisiert",
  },
  "task deleted successfully": {
    vi: "Xóa công việc thành công",
    en: "Task deleted successfully",
    es: "Tarea eliminada con éxito",
    fr: "Tâche supprimée avec succès",
    pt: "Tarefa excluída com sucesso",
    de: "Aufgabe erfolgreich gelöscht",
  },
  "tasks deleted successfully": {
    vi: "Đã xóa các công việc thành công",
    en: "Tasks deleted successfully",
    es: "Tareas eliminadas con éxito",
    fr: "Tâches supprimées avec succès",
    pt: "Tarefas excluídas com sucesso",
    de: "Aufgaben erfolgreich gelöscht",
  },
  "failed to create task": {
    vi: "Không thể tạo công việc",
    en: "Failed to create task",
    es: "Error al crear la tarea",
    fr: "Échec de la création de la tâche",
    pt: "Falha ao criar tarefa",
    de: "Fehler beim Erstellen der Aufgabe",
  },
  "failed to update task": {
    vi: "Không thể cập nhật công việc",
    en: "Failed to update task",
    es: "Error al actualizar la tarea",
    fr: "Échec de la mise à jour de la tâche",
    pt: "Falha ao atualizar tarefa",
    de: "Fehler beim Aktualisieren der Aufgabe",
  },
  "failed to delete task": {
    vi: "Không thể xóa công việc",
    en: "Failed to delete task",
    es: "Error al eliminar la tarea",
    fr: "Échec de la suppression de la tâche",
    pt: "Falha ao excluir tarefa",
    de: "Fehler beim Löschen der Aufgabe",
  },
  "failed to delete tasks": {
    vi: "Không thể xóa các công việc",
    en: "Failed to delete tasks",
    es: "Error al eliminar las tareas",
    fr: "Échec de la suppression des tâches",
    pt: "Falha ao excluir tarefas",
    de: "Fehler beim Löschen der Aufgaben",
  },
  "please enter a task title": {
    vi: "Vui lòng nhập tiêu đề công việc.",
    en: "Please enter a task title.",
    es: "Por favor, introduzca un título para la tarea.",
    fr: "Veuillez saisir un titre de tâche.",
    pt: "Por favor, insira um título para a tarefa.",
    de: "Bitte geben Sie einen Aufgabentitel ein.",
  },
  "please select a project": {
    vi: "Vui lòng chọn một dự án.",
    en: "Please select a project.",
    es: "Por favor, seleccione un proyecto.",
    fr: "Veuillez sélectionner un projet.",
    pt: "Por favor, selecione um projeto.",
    de: "Bitte wählen Sie ein Projekt aus.",
  },
  "please fill in all required fields": {
    vi: "Vui lòng điền đầy đủ các trường bắt buộc.",
    en: "Please fill in all required fields.",
    es: "Por favor, complete todos los campos obligatorios.",
    fr: "Veuillez remplir tous les champs obligatoires.",
    pt: "Por favor, preencha todos os campos obrigatórios.",
    de: "Bitte füllen Sie alle erforderlichen Felder aus.",
  },
  "all fields are required": {
    vi: "Tất cả các trường đều là bắt buộc",
    en: "All fields are required",
    es: "Todos los campos son obligatorios",
    fr: "Tous les champs sont obligatoires",
    pt: "Todos os campos são obrigatórios",
    de: "Alle Felder sind erforderlich",
  },
  "failed to load project members": {
    vi: "Không thể tải danh sách thành viên dự án",
    en: "Failed to load project members",
    es: "Error al cargar los miembros del proyecto",
    fr: "Échec du chargement des membres du projet",
    pt: "Falha ao carregar membros do projeto",
    de: "Projektmitglieder konnten nicht geladen werden",
  },
  "failed to load project statuses": {
    vi: "Không thể tải danh sách trạng thái dự án",
    en: "Failed to load project statuses",
    es: "Error al cargar los estados del proyecto",
    fr: "Échec du chargement des statuts du projet",
    pt: "Falha ao carregar status do projeto",
    de: "Projektstatus konnten nicht geladen werden",
  },
  "failed to load project sprints": {
    vi: "Không thể tải danh sách sprint của dự án",
    en: "Failed to load project sprints",
    es: "Error al cargar los sprints del proyecto",
    fr: "Échec du chargement des sprints du projet",
    pt: "Falha ao carregar sprints do projeto",
    de: "Projekt-Sprints konnten nicht geladen werden",
  },
  "failed to load tasks": {
    vi: "Không thể tải danh sách công việc",
    en: "Failed to load tasks",
    es: "Error al cargar las tareas",
    fr: "Échec du chargement des tâches",
    pt: "Falha ao carregar tarefas",
    de: "Aufgaben konnten nicht geladen werden",
  },

  // --- Projects ---
  "project created successfully": {
    vi: "Tạo dự án thành công",
    en: "Project created successfully",
    es: "Proyecto creado con éxito",
    fr: "Projet créé avec succès",
    pt: "Projeto criado com sucesso",
    de: "Projekt erfolgreich erstellt",
  },
  "project updated successfully": {
    vi: "Cập nhật dự án thành công",
    en: "Project updated successfully",
    es: "Proyecto actualizado con éxito",
    fr: "Projet mis à jour avec succès",
    pt: "Projeto atualizado com sucesso",
    de: "Projekt erfolgreich aktualisiert",
  },
  "project deleted successfully": {
    vi: "Xóa dự án thành công",
    en: "Project deleted successfully",
    es: "Proyecto eliminado con éxito",
    fr: "Projet supprimé avec succès",
    pt: "Projeto excluído com sucesso",
    de: "Projekt erfolgreich gelöscht",
  },
  "project archived successfully": {
    vi: "Lưu trữ dự án thành công",
    en: "Project archived successfully",
    es: "Proyecto archivado con éxito",
    fr: "Projet archivé avec succès",
    pt: "Projeto arquivado com sucesso",
    de: "Projekt erfolgreich archiviert",
  },
  "project unarchived successfully": {
    vi: "Khôi phục dự án thành công",
    en: "Project unarchived successfully",
    es: "Proyecto desarchivado con éxito",
    fr: "Projet désarchivé avec succès",
    pt: "Projeto desarquivado com sucesso",
    de: "Projekt erfolgreich wiederhergestellt",
  },
  "failed to create project": {
    vi: "Không thể tạo dự án",
    en: "Failed to create project",
    es: "Error al crear el proyecto",
    fr: "Échec de la création du projet",
    pt: "Falha ao criar projeto",
    de: "Fehler beim Erstellen des Projekts",
  },
  "failed to update project": {
    vi: "Không thể cập nhật dự án",
    en: "Failed to update project",
    es: "Error al actualizar el proyecto",
    fr: "Échec de la mise à jour du projet",
    pt: "Falha ao atualizar projeto",
    de: "Fehler beim Aktualisieren des Projekts",
  },
  "failed to delete project": {
    vi: "Không thể xóa dự án",
    en: "Failed to delete project",
    es: "Error al eliminar el proyecto",
    fr: "Échec de la suppression du projet",
    pt: "Falha ao excluir projeto",
    de: "Fehler beim Löschen des Projekts",
  },

  // --- Workspaces ---
  "workspace created successfully": {
    vi: "Tạo không gian làm việc thành công",
    en: "Workspace created successfully",
    es: "Espacio de trabajo creado con éxito",
    fr: "Espace de travail créé avec succès",
    pt: "Espaço de trabalho criado com sucesso",
    de: "Arbeitsbereich erfolgreich erstellt",
  },
  "workspace updated successfully": {
    vi: "Cập nhật không gian làm việc thành công",
    en: "Workspace updated successfully",
    es: "Espacio de trabajo actualizado con éxito",
    fr: "Espace de travail mis à jour avec succès",
    pt: "Espaço de trabalho atualizado com sucesso",
    de: "Arbeitsbereich erfolgreich aktualisiert",
  },
  "workspace deleted successfully": {
    vi: "Xóa không gian làm việc thành công",
    en: "Workspace deleted successfully",
    es: "Espacio de trabajo eliminado con éxito",
    fr: "Espace de travail supprimé avec succès",
    pt: "Espaço de trabalho excluído com sucesso",
    de: "Arbeitsbereich erfolgreich gelöscht",
  },
  "workspace archived successfully": {
    vi: "Lưu trữ không gian làm việc thành công",
    en: "Workspace archived successfully",
    es: "Espacio de trabajo archivado con éxito",
    fr: "Espace de travail archivé avec succès",
    pt: "Espaço de trabalho arquivado com sucesso",
    de: "Arbeitsbereich erfolgreich archiviert",
  },
  "workspace unarchived successfully": {
    vi: "Khôi phục không gian làm việc thành công",
    en: "Workspace unarchived successfully",
    es: "Espacio de trabajo desarchivado con éxito",
    fr: "Espace de travail désarchivé avec succès",
    pt: "Espaço de trabalho desarquivado com sucesso",
    de: "Arbeitsbereich erfolgreich wiederhergestellt",
  },
  "failed to create workspace": {
    vi: "Không thể tạo không gian làm việc",
    en: "Failed to create workspace",
    es: "Error al crear el espacio de trabajo",
    fr: "Échec de la création de l'espace de travail",
    pt: "Falha ao criar espaço de trabalho",
    de: "Fehler beim Erstellen des Arbeitsbereichs",
  },
  "failed to update workspace": {
    vi: "Không thể cập nhật không gian làm việc",
    en: "Failed to update workspace",
    es: "Error al actualizar el espacio de trabajo",
    fr: "Échec de la mise à jour de l'espace de travail",
    pt: "Falha ao atualizar espaço de trabalho",
    de: "Fehler beim Aktualisieren des Arbeitsbereichs",
  },
  "failed to delete workspace": {
    vi: "Không thể xóa không gian làm việc",
    en: "Failed to delete workspace",
    es: "Error al eliminar el espacio de trabajo",
    fr: "Échec de la suppression de l'espace de travail",
    pt: "Falha ao excluir espaço de trabalho",
    de: "Fehler beim Löschen des Arbeitsbereichs",
  },

  // --- Sprints ---
  "sprint created successfully": {
    vi: "Tạo Sprint thành công",
    en: "Sprint created successfully",
    es: "Sprint creado con éxito",
    fr: "Sprint créé avec succès",
    pt: "Sprint criado com sucesso",
    de: "Sprint erfolgreich erstellt",
  },
  "sprint updated successfully": {
    vi: "Cập nhật Sprint thành công",
    en: "Sprint updated successfully",
    es: "Sprint actualizado con éxito",
    fr: "Sprint mis à jour avec succès",
    pt: "Sprint atualizado com sucesso",
    de: "Sprint erfolgreich aktualisiert",
  },
  "sprint started successfully": {
    vi: "Bắt đầu Sprint thành công",
    en: "Sprint started successfully",
    es: "Sprint iniciado con éxito",
    fr: "Sprint démarré avec succès",
    pt: "Sprint iniciado com sucesso",
    de: "Sprint erfolgreich gestartet",
  },
  "sprint completed successfully": {
    vi: "Hoàn thành Sprint thành công",
    en: "Sprint completed successfully",
    es: "Sprint completado con éxito",
    fr: "Sprint terminé avec succès",
    pt: "Sprint concluído com sucesso",
    de: "Sprint erfolgreich abgeschlossen",
  },
  "sprint deleted successfully": {
    vi: "Xóa Sprint thành công",
    en: "Sprint deleted successfully",
    es: "Sprint eliminado con éxito",
    fr: "Sprint supprimé avec succès",
    pt: "Sprint excluído com sucesso",
    de: "Sprint erfolgreich gelöscht",
  },
  "failed to create sprint": {
    vi: "Không thể tạo Sprint",
    en: "Failed to create sprint",
    es: "Error al crear el sprint",
    fr: "Échec de la création du sprint",
    pt: "Falha ao criar sprint",
    de: "Fehler beim Erstellen des Sprints",
  },
  "failed to update sprint": {
    vi: "Không thể cập nhật Sprint",
    en: "Failed to update sprint",
    es: "Error al actualizar el sprint",
    fr: "Échec de la mise à jour du sprint",
    pt: "Falha ao atualizar sprint",
    de: "Fehler beim Aktualisieren des Sprints",
  },
  "failed to start sprint": {
    vi: "Không thể bắt đầu Sprint",
    en: "Failed to start sprint",
    es: "Error al iniciar el sprint",
    fr: "Échec du démarrage du sprint",
    pt: "Falha ao iniciar sprint",
    de: "Sprint konnte nicht gestartet werden",
  },
  "failed to complete sprint": {
    vi: "Không thể hoàn thành Sprint",
    en: "Failed to complete sprint",
    es: "Error al completar el sprint",
    fr: "Échec de la finalisation du sprint",
    pt: "Falha ao concluir sprint",
    de: "Sprint konnte nicht abgeschlossen werden",
  },
  "failed to delete sprint": {
    vi: "Không thể xóa Sprint",
    en: "Failed to delete sprint",
    es: "Error al eliminar el sprint",
    fr: "Échec de la suppression du sprint",
    pt: "Falha ao excluir sprint",
    de: "Fehler beim Löschen des Sprints",
  },

  // --- Auth & User ---
  "password changed successfully": {
    vi: "Mật khẩu đã được thay đổi thành công",
    en: "Password changed successfully",
    es: "Contraseña cambiada con éxito",
    fr: "Mot de passe modifié avec succès",
    pt: "Senha alterada com sucesso",
    de: "Passwort erfolgreich geändert",
  },
  "mật khẩu đã được thay đổi thành công": {
    vi: "Mật khẩu đã được thay đổi thành công",
    en: "Password changed successfully",
    es: "Contraseña cambiada con éxito",
    fr: "Mot de passe modifié avec succès",
    pt: "Senha alterada com sucesso",
    de: "Passwort erfolgreich geändert",
  },
  "mật khẩu hiện tại không chính xác": {
    vi: "Mật khẩu hiện tại không chính xác",
    en: "Current password is incorrect",
    es: "La contraseña actual es incorrecta",
    fr: "Le mot de passe actuel est incorrect",
    pt: "A senha atual está incorreta",
    de: "Das aktuelle Passwort ist falsch",
  },
  "mật khẩu xác nhận không khớp": {
    vi: "Mật khẩu xác nhận không khớp",
    en: "Confirm password does not match",
    es: "La confirmación de la contraseña no coincide",
    fr: "La confirmation du mot de passe ne correspond pas",
    pt: "A confirmação de senha não coincide",
    de: "Passwort-Bestätigung stimmt nicht überein",
  },
  "profile updated successfully": {
    vi: "Cập nhật hồ sơ thành công",
    en: "Profile updated successfully",
    es: "Perfil actualizado con éxito",
    fr: "Profil mis à jour avec succès",
    pt: "Perfil atualizado com sucesso",
    de: "Profil erfolgreich aktualisiert",
  },
  "settings saved successfully": {
    vi: "Đã lưu cài đặt thành công",
    en: "Settings saved successfully",
    es: "Configuración guardada con éxito",
    fr: "Paramètres enregistrés avec succès",
    pt: "Configurações salvas com sucesso",
    de: "Einstellungen erfolgreich gespeichert",
  },
  "failed to save settings": {
    vi: "Không thể lưu cài đặt",
    en: "Failed to save settings",
    es: "Error al guardar la configuración",
    fr: "Échec de l'enregistrement des paramètres",
    pt: "Falha ao salvar configurações",
    de: "Einstellungen konnten nicht gespeichert werden",
  },

  // --- Notifications ---
  "all notifications marked as read": {
    vi: "Đã đánh dấu tất cả thông báo là đã đọc",
    en: "All notifications marked as read",
    es: "Todas las notificaciones marcadas como leídas",
    fr: "Toutes les notifications marquées comme lues",
    pt: "Todas as notificações marcadas como lidas",
    de: "Alle Benachrichtigungen als gelesen markiert",
  },
  "notification deleted successfully": {
    vi: "Xóa thông báo thành công",
    en: "Notification deleted successfully",
    es: "Notificación eliminada con éxito",
    fr: "Notification supprimée avec succès",
    pt: "Notificação excluída com sucesso",
    de: "Benachrichtigung erfolgreich gelöscht",
  },
  "notifications deleted successfully": {
    vi: "Đã xóa các thông báo thành công",
    en: "Notifications deleted successfully",
    es: "Notificaciones eliminadas con éxito",
    fr: "Notifications supprimées avec succès",
    pt: "Notificações excluídas com sucesso",
    de: "Benachrichtigungen erfolgreich gelöscht",
  },

  // --- Images & Files ---
  "image uploaded successfully": {
    vi: "Tải ảnh lên thành công",
    en: "Image uploaded successfully",
    es: "Imagen subida con éxito",
    fr: "Image téléchargée avec succès",
    pt: "Imagem enviada com sucesso",
    de: "Bild erfolgreich hochgeladen",
  },
  "image upload failed": {
    vi: "Tải ảnh lên thất bại",
    en: "Image upload failed",
    es: "Error al subir la imagen",
    fr: "Échec du téléchargement de l'image",
    pt: "Falha no envio da imagem",
    de: "Bild-Upload fehlgeschlagen",
  },
  "invalid file type": {
    vi: "Loại tệp không hợp lệ",
    en: "Invalid file type",
    es: "Tipo de archivo no válido",
    fr: "Type de fichier non valide",
    pt: "Tipo de arquivo inválido",
    de: "Ungültiger Dateityp",
  },
  "file size too large": {
    vi: "Kích thước tệp quá lớn",
    en: "File size too large",
    es: "Tamaño de archivo demasiado grande",
    fr: "Fichier trop volumineux",
    pt: "Tamanho do arquivo muito grande",
    de: "Dateigröße zu groß",
  },
  "attachment uploaded successfully": {
    vi: "Tải tệp đính kèm lên thành công",
    en: "Attachment uploaded successfully",
    es: "Archivo adjunto subido con éxito",
    fr: "Pièce jointe téléchargée avec succès",
    pt: "Anexo enviado com sucesso",
    de: "Anhang erfolgreich hochgeladen",
  },
  "attachment deleted successfully": {
    vi: "Xóa tệp đính kèm thành công",
    en: "Attachment deleted successfully",
    es: "Archivo adjunto eliminado con éxito",
    fr: "Pièce jointe supprimée avec succès",
    pt: "Anexo excluído com sucesso",
    de: "Anhang erfolgreich gelöscht",
  },

  // --- Clipboard & Common ---
  "copied to clipboard": {
    vi: "Đã sao chép vào bộ nhớ tạm",
    en: "Copied to clipboard",
    es: "Copiado al portapapeles",
    fr: "Copié dans le presse-papiers",
    pt: "Copiado para a área de transferência",
    de: "In die Zwischenablage kopiert",
  },
  "link copied to clipboard": {
    vi: "Đã sao chép liên kết vào bộ nhớ tạm",
    en: "Link copied to clipboard",
    es: "Enlace copiado al portapapeles",
    fr: "Lien copié dans le presse-papiers",
    pt: "Link copiado para a área de transferência",
    de: "Link in die Zwischenablage kopiert",
  },
  "share link revoked successfully": {
    vi: "Thu hồi liên kết chia sẻ thành công",
    en: "Share link revoked successfully",
    es: "Enlace compartido revocado con éxito",
    fr: "Lien de partage révoqué avec succès",
    pt: "Link de compartilhamento revogado com sucesso",
    de: "Freigabelink erfolgreich widerrufen",
  },
  "network error": {
    vi: "Lỗi kết nối mạng",
    en: "Network error",
    es: "Error de red",
    fr: "Erreur réseau",
    pt: "Erro de rede",
    de: "Netzwerkfehler",
  },
  "unauthorized": {
    vi: "Bạn không có quyền thực hiện thao tác này",
    en: "Unauthorized",
    es: "No autorizado",
    fr: "Non autorisé",
    pt: "Não autorizado",
    de: "Nicht autorisiert",
  },
};

/**
 * Normalizes a text for lookup in the dictionary.
 */
function normalizeKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[.!?,:;]+$/, "")
    .replace(/\s+/g, " ");
}

/**
 * Dynamic pattern matchers for templates with variable content.
 */
function matchDynamicPattern(text: string, lang: SupportedLang): string | null {
  // Pattern: "Task named {title} created successfully!"
  const taskNamedMatch = text.match(/^Task named (.+?) created successfully!?$/i);
  if (taskNamedMatch) {
    const title = taskNamedMatch[1];
    switch (lang) {
      case "vi": return `Đã tạo công việc "${title}" thành công!`;
      case "es": return `¡Tarea "${title}" creada con éxito!`;
      case "fr": return `Tâche "${title}" créée avec succès !`;
      case "de": return `Aufgabe "${title}" erfolgreich erstellt!`;
      case "pt": return `Tarefa "${title}" criada com sucesso!`;
      default: return `Task named ${title} created successfully!`;
    }
  }

  // Pattern: "Invitation sent successfully to {email}"
  const inviteSentMatch = text.match(/^Invitation sent successfully to (.+)$/i);
  if (inviteSentMatch) {
    const email = inviteSentMatch[1];
    switch (lang) {
      case "vi": return `Đã gửi lời mời thành công tới ${email}`;
      case "es": return `Invitación enviada con éxito a ${email}`;
      case "fr": return `Invitation envoyée avec succès à ${email}`;
      case "de": return `Einladung erfolgreich an ${email} gesendet`;
      case "pt": return `Convite enviado com sucesso para ${email}`;
      default: return `Invitation sent successfully to ${email}`;
    }
  }

  // Pattern: "Unable to navigate to this {item}..."
  if (text.startsWith("Unable to navigate to this")) {
    switch (lang) {
      case "vi": return "Không thể chuyển tới mục này. Mục có thể đã bị xóa hoặc không còn quyền truy cập.";
      case "es": return "No se puede navegar a este elemento. Es posible que se haya eliminado o ya no sea accesible.";
      case "fr": return "Impossible d'accéder à cet élément. Il a peut-être été supprimé ou n'est plus accessible.";
      case "de": return "Navigation zu diesem Element nicht möglich. Es wurde möglicherweise gelöscht.";
      case "pt": return "Não é possível navegar para este item. Pode ter sido excluído.";
      default: return text;
    }
  }

  return null;
}

/**
 * Translates any toast message into the currently active i18n language.
 */
export function translateToastContent(content: any): any {
  if (typeof content !== "string" || !content.trim()) {
    return content;
  }

  const currentLang = (i18n.language ? i18n.language.split("-")[0] : "en") as SupportedLang;
  const targetLang: SupportedLang = ["vi", "en", "es", "fr", "pt", "de"].includes(currentLang)
    ? currentLang
    : "en";

  // 1. If content is an i18n key (e.g. 'common.save' or 'invitations.delete_success'), check i18n.t
  if (content.includes(".") && i18n.exists(content)) {
    return i18n.t(content);
  }

  // 2. Check dynamic template patterns
  const dynamicMatch = matchDynamicPattern(content, targetLang);
  if (dynamicMatch) {
    return dynamicMatch;
  }

  // 3. Check exact dictionary match
  const normalized = normalizeKey(content);
  const entry = TOAST_DICTIONARY[normalized];
  if (entry && entry[targetLang]) {
    return entry[targetLang];
  }

  return content;
}

/**
 * Translates toast data options (like description).
 */
function translateToastData(data?: any): any {
  if (!data || typeof data !== "object") return data;
  if (data.description && typeof data.description === "string") {
    return {
      ...data,
      description: translateToastContent(data.description),
    };
  }
  return data;
}

/**
 * Installs the global toast translation proxy into Sonner.
 * Automatically wraps all toast calls throughout the application.
 */
let isInstalled = false;

export function installToastTranslator(): void {
  if (isInstalled || typeof window === "undefined") return;
  isInstalled = true;

  const originalToast = toast as any;

  // Intercept the default toast function
  const toastProxy = function (message: any, data?: any) {
    return originalToast(translateToastContent(message), translateToastData(data));
  };

  // Copy and wrap all method properties
  const methods = ["success", "error", "warning", "info", "loading", "message"] as const;

  methods.forEach((method) => {
    const originalMethod = originalToast[method];
    if (typeof originalMethod === "function") {
      toastProxy[method] = function (message: any, data?: any) {
        return originalMethod.call(originalToast, translateToastContent(message), translateToastData(data));
      };
    }
  });

  // Preserve other utility functions (dismiss, custom, promise, etc.)
  ["dismiss", "custom", "promise", "getHistory"].forEach((prop) => {
    if (typeof originalToast[prop] === "function") {
      toastProxy[prop] = originalToast[prop].bind(originalToast);
    }
  });

  // Overwrite sonner's default methods with the proxied methods
  methods.forEach((method) => {
    if (typeof originalToast[method] === "function") {
      const orig = originalToast[method];
      originalToast[method] = function (message: any, data?: any) {
        return orig.call(originalToast, translateToastContent(message), translateToastData(data));
      };
    }
  });
}

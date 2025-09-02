export interface User {
  id: string; // Notion page ID
  name: string;
  email: string;
  password?: string; // This might be sensitive, handle with care
  avatarUrl?: string;
}

// Helper interfaces for Notion's specific data structure
export interface NotionTitle {
  title: { text: { content: string } }[];
}

export interface NotionEmail {
  email: string;
}

export interface NotionRichText {
  rich_text: { text: { content: string } }[];
}

export interface NotionUrl {
  url: string | null;
}

export interface NotionUserProperties {
  'Имя': NotionTitle;
  'Почта': NotionEmail;
  'Пароль': NotionRichText;
  'Аватар': NotionUrl;
}

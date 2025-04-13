/**
 * ESA API Types
 */

// Pagination response
export interface PaginationResponse {
  prev_page: number | null;
  next_page: number | null;
  total_count: number;
  page: number;
  per_page: number;
  max_per_page: number;
}

// User type
export interface User {
  myself: boolean;
  name: string;
  screen_name: string;
  icon: string;
  email?: string;
}

// Team type
export interface Team {
  name: string;
  privacy: 'closed' | 'open';
  description: string;
  icon: string;
  url: string;
}

// Teams response
export interface TeamsResponse extends PaginationResponse {
  teams: Team[];
}

// Team response
export interface TeamResponse extends Team {}

// Stats type
export interface Stats {
  members: number;
  posts: number;
  posts_wip: number;
  posts_shipped: number;
  comments: number;
  stars: number;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
}

// Member type
export interface Member {
  myself: boolean;
  name: string;
  screen_name: string;
  icon: string;
  email?: string;
  role: 'owner' | 'member';
  posts_count: number;
  joined_at: string;
  last_accessed_at: string;
}

// Members response
export interface MembersResponse extends PaginationResponse {
  members: Member[];
}

// Post type
export interface Post {
  number: number;
  name: string;
  full_name: string;
  wip: boolean;
  body_md: string;
  body_html: string;
  created_at: string;
  message: string;
  url: string;
  updated_at: string;
  tags: string[];
  category: string | null;
  revision_number: number;
  created_by: User;
  updated_by: User;
  kind?: 'stock' | 'flow';
  comments_count?: number;
  tasks_count?: number;
  done_tasks_count?: number;
  stargazers_count?: number;
  watchers_count?: number;
  star?: boolean;
  watch?: boolean;
  overlapped?: boolean;
}

// Posts response
export interface PostsResponse extends PaginationResponse {
  posts: Post[];
}

// Comment type
export interface Comment {
  id: number;
  body_md: string;
  body_html: string;
  created_at: string;
  updated_at: string;
  url: string;
  created_by: User;
  stargazers_count: number;
  star: boolean;
}

// Comments response
export interface CommentsResponse extends PaginationResponse {
  comments: Comment[];
}

// Star type
export interface Star {
  created_at: string;
  body: string | null;
  user: User;
}

// Stargazers response
export interface StargazersResponse extends PaginationResponse {
  stargazers: Star[];
}

// Watcher type
export interface Watcher {
  created_at: string;
  user: User;
}

// Watchers response
export interface WatchersResponse extends PaginationResponse {
  watchers: Watcher[];
}

// Batch move response
export interface BatchMoveResponse {
  count: number;
  from: string;
  to: string;
}

// Tag type
export interface Tag {
  name: string;
  posts_count: number;
}

// Tags response
export interface TagsResponse extends PaginationResponse {
  tags: Tag[];
}

// Invitation URL response
export interface InvitationUrlResponse {
  url: string;
}

// Invitation type
export interface Invitation {
  email: string;
  code: string;
  expires_at: string;
  url: string;
}

// Invitations response
export interface InvitationsResponse extends PaginationResponse {
  invitations: Invitation[];
}

// Create invitations response
export interface CreateInvitationsResponse {
  invitations: Invitation[];
}

// Emoji type
export interface Emoji {
  code: string;
  aliases: string[];
  category: string;
  raw: string | null;
  url: string;
}

// Emojis response
export interface EmojisResponse {
  emojis: Emoji[];
}

// Create emoji response
export interface CreateEmojiResponse {
  code: string;
}

// Authenticated user type
export interface AuthenticatedUser {
  id: number;
  name: string;
  screen_name: string;
  created_at: string;
  updated_at: string;
  icon: string;
  email: string;
  teams?: Team[];
}

// Request parameters

export interface PostsRequestParams {
  q?: string;
  include?: string;
  sort?: 'updated' | 'created' | 'number' | 'stars' | 'watches' | 'comments' | 'best_match';
  order?: 'desc' | 'asc';
  page?: number;
  per_page?: number;
}

export interface CreatePostParams {
  name: string;
  body_md?: string;
  tags?: string[];
  category?: string;
  wip?: boolean;
  message?: string;
  user?: string;
  template_post_id?: number;
}

export interface UpdatePostParams {
  name?: string;
  body_md?: string;
  tags?: string[];
  category?: string;
  wip?: boolean;
  message?: string;
  created_by?: string;
  updated_by?: string;
  original_revision?: {
    body_md: string;
    number: number;
    user: string;
  };
}

export interface CreateCommentParams {
  body_md: string;
  user?: string;
}

export interface UpdateCommentParams {
  body_md: string;
  user?: string;
}

export interface CreateStarParams {
  body?: string;
}

export interface BatchMoveCategoryParams {
  from: string;
  to: string;
}

export interface InviteMembersParams {
  emails: string[];
}

export interface CreateEmojiParams {
  code: string;
  origin_code?: string;
  image?: string | File;
}

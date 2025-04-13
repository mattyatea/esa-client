import {
  Team, TeamsResponse, TeamResponse, Stats,
  Member, MembersResponse,
  Post, PostsResponse, CreatePostParams, UpdatePostParams,
  Comment, CommentsResponse, CreateCommentParams, UpdateCommentParams,
  StargazersResponse, CreateStarParams, WatchersResponse,
  BatchMoveCategoryParams, BatchMoveResponse,
  TagsResponse,
  InvitationUrlResponse, Invitation, InvitationsResponse, InviteMembersParams, CreateInvitationsResponse,
  EmojisResponse, CreateEmojiParams, CreateEmojiResponse,
  AuthenticatedUser, PostsRequestParams,
  PostItem, PostsSearchResult
} from './types.js';

/**
 * ESA API Error class
 */
export class EsaApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(`ESA API Error (${status}): ${JSON.stringify(data)}`);
    this.name = 'EsaApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * ESA API Wrapper for TypeScript using fetch
 * Based on ESA API v1 documentation
 */
export class EsaClient {
  private baseUrl: string = 'https://api.esa.io/v1';
  private token: string;
  private teamName: string | null;
  
  /**
   * Create a new ESA API client
   * @param options Client configuration options
   */
  constructor(options: { token: string; teamName?: string }) {
    this.token = options.token;
    this.teamName = options.teamName || null;
  }
  
  /**
   * Set the team name for subsequent requests
   * @param teamName The ESA team name (subdomain)
   */
  public setTeamName(teamName: string): void {
    this.teamName = teamName;
  }
  
  /**
   * Get the current team name
   * @returns The current team name
   */
  public getTeamName(): string | null {
    return this.teamName;
  }
  
  /**
   * Make a request to the ESA API
   * @param method HTTP method
   * @param path API path
   * @param params Request parameters
   * @param teamName Optional team name (overrides the default)
   * @returns Promise resolving to the API response
   */
  private async request<T>(
    method: string,
    path: string,
    params: any = {},
    teamName?: string,
  ): Promise<T> {
    const team = teamName || this.teamName;
    
    // Replace :team_name in the path with the actual team name
    const processedPath = team ? path.replace(':team_name', team) : path;
    
    // Create the URL with query parameters for GET requests
    let url = `${this.baseUrl}${processedPath}`;
    let body: string | FormData | null = null;
    let headers: HeadersInit = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
    
    // Add parameters based on the HTTP method
    if (method.toLowerCase() === 'get' && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        if (params[key] !== undefined) {
          queryParams.append(key, params[key].toString());
        }
      }
      url += `?${queryParams.toString()}`;
    } else if (params instanceof FormData) {
      body = params;
      // Remove content-type header for FormData to let the browser set it with the boundary
      delete headers['Content-Type'];
    } else if (Object.keys(params).length > 0) {
      body = JSON.stringify(params);
    }
    
    try {
      // Make the request
      const response = await fetch(url, {
        method,
        headers,
        body: body as any,
      });
      
      // Check if rate limited
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
        console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
        
        // Wait for retryAfter seconds
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        // Retry the request
        return this.request<T>(method, path, params, teamName);
      }
      
      // Handle error responses before trying to parse JSON
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (e) {
          // JSONパースに失敗した場合はテキストを取得
          try {
            const text = await response.text();
            errorData = { message: text || 'Failed to parse error response' };
          } catch (textError) {
            errorData = { message: 'Failed to parse error response' };
          }
        }
        throw new EsaApiError(response.status, errorData);
      }
      
      // Parse the response for successful responses
      let data: any = null;
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch (e) {
          // 204以外で内容がない場合は空オブジェクトを返す
          data = {};
        }
      }
      
      return data as T;
    } catch (error) {
      if (error instanceof EsaApiError) {
        throw error;
      }
      
      // Handle fetch errors
      console.error('Fetch Error:', error);
      throw error;
    }
  }
  
  /**
   * GET request helper
   */
  private get<T>(path: string, params?: any, teamName?: string | undefined): Promise<T> {
    return this.request<T>('get', path, params || {}, teamName);
  }
  
  /**
   * POST request helper
   */
  private post<T>(path: string, params?: any, teamName?: string): Promise<T> {
    return this.request<T>('post', path, params || {}, teamName);
  }
  
  /**
   * PATCH request helper
   */
  private patch<T>(path: string, params?: any, teamName?: string): Promise<T> {
    return this.request<T>('patch', path, params || {}, teamName);
  }
  
  /**
   * PUT request helper
   */
  private put<T>(path: string, params?: any, teamName?: string): Promise<T> {
    return this.request<T>('put', path, params || {}, teamName);
  }
  
  /**
   * DELETE request helper
   */
  private delete<T>(path: string, params?: any, teamName?: string): Promise<T> {
    return this.request<T>('delete', path, params || {}, teamName);
  }
  
  // Teams API

  /**
   * Get teams the authenticated user belongs to
   * @param role Filter teams by role (owner or member)
   */
  public getTeams(role?: 'owner' | 'member'): Promise<TeamsResponse> {
    const params = role ? { role } : {};
    return this.get<TeamsResponse>('/teams', params);
  }

  /**
   * Get specific team
   * @param teamName The team name (subdomain)
   */
  public getTeam(teamName?: string): Promise<TeamResponse> {
    return this.get<TeamResponse>('/teams/:team_name', {}, teamName);
  }

  /**
   * Get team stats
   * @param teamName The team name (subdomain)
   */
  public getTeamStats(teamName?: string): Promise<Stats> {
    return this.get<Stats>('/teams/:team_name/stats', {}, teamName);
  }

  // Members API

  /**
   * Get team members
   * @param options Sorting options
   * @param teamName The team name (subdomain)
   */
  public getMembers(
    options?: {
      sort?: 'posts_count' | 'joined' | 'last_accessed';
      order?: 'desc' | 'asc';
      page?: number;
      per_page?: number;
    },
    teamName?: string
  ): Promise<MembersResponse> {
    return this.get<MembersResponse>('/teams/:team_name/members', options, teamName);
  }

  /**
   * Get a specific member
   * @param screenNameOrEmail The screen name or email of the member
   * @param teamName The team name (subdomain)
   */
  public getMember(screenNameOrEmail: string, teamName?: string): Promise<Member> {
    return this.get<Member>(`/teams/:team_name/members/${screenNameOrEmail}`, {}, teamName);
  }

  /**
   * Delete a member from team
   * @param screenNameOrEmail The screen name or email of the member
   * @param teamName The team name (subdomain)
   */
  public deleteMember(screenNameOrEmail: string, teamName?: string): Promise<void> {
    return this.delete<void>(`/teams/:team_name/members/${screenNameOrEmail}`, {}, teamName);
  }

  // Posts API

  /**
   * Get posts
   * @param params Request parameters
   * @param teamName The team name (subdomain)
   */
  public getPosts(params?: PostsRequestParams, teamName?: string): Promise<PostsResponse> {
    return this.get<PostsResponse>('/teams/:team_name/posts', params, teamName);
  }

  /**
   * Get a specific post
   * @param postNumber The post number
   * @param include Additional data to include
   * @param teamName The team name (subdomain)
   */
  public getPost(
    postNumber: number,
    include?: 'comments' | 'comments,comments.stargazers' | 'stargazers' | string,
    teamName?: string
  ): Promise<Post> {
    const params = include ? { include } : {};
    return this.get<Post>(`/teams/:team_name/posts/${postNumber}`, params, teamName);
  }

  /**
   * Create a new post
   * @param params Post parameters
   * @param teamName The team name (subdomain)
   */
  public createPost(params: CreatePostParams, teamName?: string): Promise<Post> {
    return this.post<Post>('/teams/:team_name/posts', { post: params }, teamName);
  }

  /**
   * Update a post
   * @param postNumber The post number
   * @param params Post parameters
   * @param teamName The team name (subdomain)
   */
  public updatePost(postNumber: number, params: UpdatePostParams, teamName?: string): Promise<Post> {
    return this.patch<Post>(`/teams/:team_name/posts/${postNumber}`, { post: params }, teamName);
  }

  /**
   * Delete a post
   * @param postNumber The post number
   * @param teamName The team name (subdomain)
   */
  public deletePost(postNumber: number, teamName?: string): Promise<void> {
    return this.delete<void>(`/teams/:team_name/posts/${postNumber}`, {}, teamName);
  }

  public searchPosts(searchParams: string){
    const params = encodeURI(searchParams)
    
    return this.get<PostsSearchResult>('/teams/docs/posts', { q: params })
  }

  // Comments API

  /**
   * Get comments for a post
   * @param postNumber The post number
   * @param options Pagination options
   * @param teamName The team name (subdomain)
   */
  public getPostComments(
    postNumber: number,
    options?: { page?: number; per_page?: number },
    teamName?: string
  ): Promise<CommentsResponse> {
    return this.get<CommentsResponse>(`/teams/:team_name/posts/${postNumber}/comments`, options, teamName);
  }

  /**
   * Get a specific comment
   * @param commentId The comment ID
   * @param include Additional data to include
   * @param teamName The team name (subdomain)
   */
  public getComment(
    commentId: number,
    include?: 'stargazers',
    teamName?: string
  ): Promise<Comment> {
    const params = include ? { include } : {};
    return this.get<Comment>(`/teams/:team_name/comments/${commentId}`, params, teamName);
  }

  /**
   * Create a comment
   * @param postNumber The post number
   * @param params Comment parameters
   * @param teamName The team name (subdomain)
   */
  public createComment(
    postNumber: number,
    params: CreateCommentParams,
    teamName?: string
  ): Promise<Comment> {
    return this.post<Comment>(
      `/teams/:team_name/posts/${postNumber}/comments`,
      { comment: params },
      teamName
    );
  }

  /**
   * Update a comment
   * @param commentId The comment ID
   * @param params Comment parameters
   * @param teamName The team name (subdomain)
   */
  public updateComment(
    commentId: number,
    params: UpdateCommentParams,
    teamName?: string
  ): Promise<Comment> {
    return this.patch<Comment>(
      `/teams/:team_name/comments/${commentId}`,
      { comment: params },
      teamName
    );
  }

  /**
   * Delete a comment
   * @param commentId The comment ID
   * @param teamName The team name (subdomain)
   */
  public deleteComment(commentId: number, teamName?: string): Promise<void> {
    return this.delete<void>(`/teams/:team_name/comments/${commentId}`, {}, teamName);
  }

  /**
   * Get all comments in team
   * @param options Pagination options
   * @param teamName The team name (subdomain)
   */
  public getAllComments(
    options?: { page?: number; per_page?: number },
    teamName?: string
  ): Promise<CommentsResponse> {
    return this.get<CommentsResponse>('/teams/:team_name/comments', options, teamName);
  }

  // Star API

  /**
   * Get stargazers for a post
   * @param postNumber The post number
   * @param options Pagination options
   * @param teamName The team name (subdomain)
   */
  public getPostStargazers(
    postNumber: number,
    options?: { page?: number; per_page?: number },
    teamName?: string
  ): Promise<StargazersResponse> {
    return this.get<StargazersResponse>(
      `/teams/:team_name/posts/${postNumber}/stargazers`,
      options,
      teamName
    );
  }

  /**
   * Star a post
   * @param postNumber The post number
   * @param params Star parameters
   * @param teamName The team name (subdomain)
   */
  public starPost(
    postNumber: number,
    params?: CreateStarParams,
    teamName?: string
  ): Promise<void> {
    return this.post<void>(
      `/teams/:team_name/posts/${postNumber}/star`,
      params,
      teamName
    );
  }

  /**
   * Unstar a post
   * @param postNumber The post number
   * @param teamName The team name (subdomain)
   */
  public unstarPost(postNumber: number, teamName?: string): Promise<void> {
    return this.delete<void>(
      `/teams/:team_name/posts/${postNumber}/star`,
      {},
      teamName
    );
  }

  /**
   * Get stargazers for a comment
   * @param commentId The comment ID
   * @param options Pagination options
   * @param teamName The team name (subdomain)
   */
  public getCommentStargazers(
    commentId: number,
    options?: { page?: number; per_page?: number },
    teamName?: string
  ): Promise<StargazersResponse> {
    return this.get<StargazersResponse>(
      `/teams/:team_name/comments/${commentId}/stargazers`,
      options,
      teamName
    );
  }

  /**
   * Star a comment
   * @param commentId The comment ID
   * @param params Star parameters
   * @param teamName The team name (subdomain)
   */
  public starComment(
    commentId: number,
    params?: CreateStarParams,
    teamName?: string
  ): Promise<void> {
    return this.post<void>(
      `/teams/:team_name/comments/${commentId}/star`,
      params,
      teamName
    );
  }

  /**
   * Unstar a comment
   * @param commentId The comment ID
   * @param teamName The team name (subdomain)
   */
  public unstarComment(commentId: number, teamName?: string): Promise<void> {
    return this.delete<void>(
      `/teams/:team_name/comments/${commentId}/star`,
      {},
      teamName
    );
  }

  // Watch API

  /**
   * Get watchers for a post
   * @param postNumber The post number
   * @param options Pagination options
   * @param teamName The team name (subdomain)
   */
  public getPostWatchers(
    postNumber: number,
    options?: { page?: number; per_page?: number },
    teamName?: string
  ): Promise<WatchersResponse> {
    return this.get<WatchersResponse>(
      `/teams/:team_name/posts/${postNumber}/watchers`,
      options,
      teamName
    );
  }

  /**
   * Watch a post
   * @param postNumber The post number
   * @param teamName The team name (subdomain)
   */
  public watchPost(postNumber: number, teamName?: string): Promise<void> {
    return this.post<void>(
      `/teams/:team_name/posts/${postNumber}/watch`,
      {},
      teamName
    );
  }

  /**
   * Unwatch a post
   * @param postNumber The post number
   * @param teamName The team name (subdomain)
   */
  public unwatchPost(postNumber: number, teamName?: string): Promise<void> {
    return this.delete<void>(
      `/teams/:team_name/posts/${postNumber}/watch`,
      {},
      teamName
    );
  }

  // Category API

  /**
   * Batch move categories
   * @param params Batch move parameters
   * @param teamName The team name (subdomain)
   */
  public batchMoveCategory(
    params: BatchMoveCategoryParams,
    teamName?: string
  ): Promise<BatchMoveResponse> {
    return this.post<BatchMoveResponse>(
      '/teams/:team_name/categories/batch_move',
      params,
      teamName
    );
  }

  // Tags API

  /**
   * Get tags
   * @param teamName The team name (subdomain)
   */
  public getTags(teamName?: string): Promise<TagsResponse> {
    return this.get<TagsResponse>('/teams/:team_name/tags', {}, teamName);
  }

  // Invitation API

  /**
   * Get invitation URL
   * @param teamName The team name (subdomain)
   */
  public getInvitationUrl(teamName?: string): Promise<InvitationUrlResponse> {
    return this.get<InvitationUrlResponse>('/teams/:team_name/invitation', {}, teamName);
  }

  /**
   * Regenerate invitation URL
   * @param teamName The team name (subdomain)
   */
  public regenerateInvitationUrl(teamName?: string): Promise<InvitationUrlResponse> {
    return this.post<InvitationUrlResponse>('/teams/:team_name/invitation_regenerator', {}, teamName);
  }

  /**
   * Invite members by email
   * @param params Invitation parameters
   * @param teamName The team name (subdomain)
   */
  public inviteMembers(
    params: InviteMembersParams,
    teamName?: string
  ): Promise<CreateInvitationsResponse> {
    return this.post<CreateInvitationsResponse>(
      '/teams/:team_name/invitations',
      { member: params },
      teamName
    );
  }

  /**
   * Get pending invitations
   * @param options Pagination options
   * @param teamName The team name (subdomain)
   */
  public getInvitations(
    options?: { page?: number; per_page?: number },
    teamName?: string
  ): Promise<InvitationsResponse> {
    return this.get<InvitationsResponse>('/teams/:team_name/invitations', options, teamName);
  }

  /**
   * Delete invitation
   * @param code The invitation code
   * @param teamName The team name (subdomain)
   */
  public deleteInvitation(code: string, teamName?: string): Promise<void> {
    return this.delete<void>(`/teams/:team_name/invitations/${code}`, {}, teamName);
  }

  // Emoji API

  /**
   * Get emojis
   * @param includeAll Include all emojis (not just team-specific ones)
   * @param teamName The team name (subdomain)
   */
  public getEmojis(includeAll?: boolean, teamName?: string): Promise<EmojisResponse> {
    const params = includeAll ? { include: 'all' } : {};
    return this.get<EmojisResponse>('/teams/:team_name/emojis', params, teamName);
  }

  /**
   * Create a new emoji
   * @param params Emoji parameters
   * @param teamName The team name (subdomain)
   */
  public createEmoji(
    params: CreateEmojiParams,
    teamName?: string
  ): Promise<CreateEmojiResponse> {
    const team = teamName || this.teamName;
    if (!team) {
      throw new Error('Team name is required for creating emoji');
    }
    
    const formData = new FormData();
    formData.append('emoji[code]', params.code);
    
    if (params.origin_code) {
      formData.append('emoji[origin_code]', params.origin_code);
    }
    
    if (params.image) {
      if (typeof params.image === 'string') {
        formData.append('emoji[image]', params.image);
      } else {
        formData.append('emoji[image]', params.image);
      }
    }
    
    return this.request<CreateEmojiResponse>(
      'post',
      `/teams/:team_name/emojis`,
      formData,
      team
    );
  }

  /**
   * Delete an emoji
   * @param code The emoji code
   * @param teamName The team name (subdomain)
   */
  public deleteEmoji(code: string, teamName?: string): Promise<void> {
    return this.delete<void>(`/teams/:team_name/emojis/${code}`, {}, teamName);
  }

  // User API

  /**
   * Get the authenticated user
   * @param includeTeams Include the user's teams
   */
  public getAuthenticatedUser(includeTeams?: boolean): Promise<AuthenticatedUser> {
    const params = includeTeams ? { include: 'teams' } : {};
    return this.get<AuthenticatedUser>('/user', params);
  }
}
import { TeamsResponse, TeamResponse, Stats, Member, MembersResponse, Post, PostsResponse, CreatePostParams, UpdatePostParams, Comment, CommentsResponse, CreateCommentParams, UpdateCommentParams, StargazersResponse, CreateStarParams, WatchersResponse, BatchMoveCategoryParams, BatchMoveResponse, TagsResponse, InvitationUrlResponse, InvitationsResponse, InviteMembersParams, CreateInvitationsResponse, EmojisResponse, CreateEmojiParams, CreateEmojiResponse, AuthenticatedUser, PostsRequestParams } from './types';
/**
 * ESA API Error class
 */
export declare class EsaApiError extends Error {
    status: number;
    data: any;
    constructor(status: number, data: any);
}
/**
 * ESA API Wrapper for TypeScript using fetch
 * Based on ESA API v1 documentation
 */
export declare class EsaClient {
    private baseUrl;
    private token;
    private teamName;
    /**
     * Create a new ESA API client
     * @param options Client configuration options
     */
    constructor(options: {
        token: string;
        teamName?: string;
    });
    /**
     * Set the team name for subsequent requests
     * @param teamName The ESA team name (subdomain)
     */
    setTeamName(teamName: string): void;
    /**
     * Get the current team name
     * @returns The current team name
     */
    getTeamName(): string | null;
    /**
     * Make a request to the ESA API
     * @param method HTTP method
     * @param path API path
     * @param params Request parameters
     * @param teamName Optional team name (overrides the default)
     * @returns Promise resolving to the API response
     */
    private request;
    /**
     * GET request helper
     */
    private get;
    /**
     * POST request helper
     */
    private post;
    /**
     * PATCH request helper
     */
    private patch;
    /**
     * PUT request helper
     */
    private put;
    /**
     * DELETE request helper
     */
    private delete;
    /**
     * Get teams the authenticated user belongs to
     * @param role Filter teams by role (owner or member)
     */
    getTeams(role?: 'owner' | 'member'): Promise<TeamsResponse>;
    /**
     * Get specific team
     * @param teamName The team name (subdomain)
     */
    getTeam(teamName?: string): Promise<TeamResponse>;
    /**
     * Get team stats
     * @param teamName The team name (subdomain)
     */
    getTeamStats(teamName?: string): Promise<Stats>;
    /**
     * Get team members
     * @param options Sorting options
     * @param teamName The team name (subdomain)
     */
    getMembers(options?: {
        sort?: 'posts_count' | 'joined' | 'last_accessed';
        order?: 'desc' | 'asc';
        page?: number;
        per_page?: number;
    }, teamName?: string): Promise<MembersResponse>;
    /**
     * Get a specific member
     * @param screenNameOrEmail The screen name or email of the member
     * @param teamName The team name (subdomain)
     */
    getMember(screenNameOrEmail: string, teamName?: string): Promise<Member>;
    /**
     * Delete a member from team
     * @param screenNameOrEmail The screen name or email of the member
     * @param teamName The team name (subdomain)
     */
    deleteMember(screenNameOrEmail: string, teamName?: string): Promise<void>;
    /**
     * Get posts
     * @param params Request parameters
     * @param teamName The team name (subdomain)
     */
    getPosts(params?: PostsRequestParams, teamName?: string): Promise<PostsResponse>;
    /**
     * Get a specific post
     * @param postNumber The post number
     * @param include Additional data to include
     * @param teamName The team name (subdomain)
     */
    getPost(postNumber: number, include?: 'comments' | 'comments,comments.stargazers' | 'stargazers' | string, teamName?: string): Promise<Post>;
    /**
     * Create a new post
     * @param params Post parameters
     * @param teamName The team name (subdomain)
     */
    createPost(params: CreatePostParams, teamName?: string): Promise<Post>;
    /**
     * Update a post
     * @param postNumber The post number
     * @param params Post parameters
     * @param teamName The team name (subdomain)
     */
    updatePost(postNumber: number, params: UpdatePostParams, teamName?: string): Promise<Post>;
    /**
     * Delete a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    deletePost(postNumber: number, teamName?: string): Promise<void>;
    searchPosts(searchParams: string): Promise<Post>;
    /**
     * Get comments for a post
     * @param postNumber The post number
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getPostComments(postNumber: number, options?: {
        page?: number;
        per_page?: number;
    }, teamName?: string): Promise<CommentsResponse>;
    /**
     * Get a specific comment
     * @param commentId The comment ID
     * @param include Additional data to include
     * @param teamName The team name (subdomain)
     */
    getComment(commentId: number, include?: 'stargazers', teamName?: string): Promise<Comment>;
    /**
     * Create a comment
     * @param postNumber The post number
     * @param params Comment parameters
     * @param teamName The team name (subdomain)
     */
    createComment(postNumber: number, params: CreateCommentParams, teamName?: string): Promise<Comment>;
    /**
     * Update a comment
     * @param commentId The comment ID
     * @param params Comment parameters
     * @param teamName The team name (subdomain)
     */
    updateComment(commentId: number, params: UpdateCommentParams, teamName?: string): Promise<Comment>;
    /**
     * Delete a comment
     * @param commentId The comment ID
     * @param teamName The team name (subdomain)
     */
    deleteComment(commentId: number, teamName?: string): Promise<void>;
    /**
     * Get all comments in team
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getAllComments(options?: {
        page?: number;
        per_page?: number;
    }, teamName?: string): Promise<CommentsResponse>;
    /**
     * Get stargazers for a post
     * @param postNumber The post number
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getPostStargazers(postNumber: number, options?: {
        page?: number;
        per_page?: number;
    }, teamName?: string): Promise<StargazersResponse>;
    /**
     * Star a post
     * @param postNumber The post number
     * @param params Star parameters
     * @param teamName The team name (subdomain)
     */
    starPost(postNumber: number, params?: CreateStarParams, teamName?: string): Promise<void>;
    /**
     * Unstar a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    unstarPost(postNumber: number, teamName?: string): Promise<void>;
    /**
     * Get stargazers for a comment
     * @param commentId The comment ID
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getCommentStargazers(commentId: number, options?: {
        page?: number;
        per_page?: number;
    }, teamName?: string): Promise<StargazersResponse>;
    /**
     * Star a comment
     * @param commentId The comment ID
     * @param params Star parameters
     * @param teamName The team name (subdomain)
     */
    starComment(commentId: number, params?: CreateStarParams, teamName?: string): Promise<void>;
    /**
     * Unstar a comment
     * @param commentId The comment ID
     * @param teamName The team name (subdomain)
     */
    unstarComment(commentId: number, teamName?: string): Promise<void>;
    /**
     * Get watchers for a post
     * @param postNumber The post number
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getPostWatchers(postNumber: number, options?: {
        page?: number;
        per_page?: number;
    }, teamName?: string): Promise<WatchersResponse>;
    /**
     * Watch a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    watchPost(postNumber: number, teamName?: string): Promise<void>;
    /**
     * Unwatch a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    unwatchPost(postNumber: number, teamName?: string): Promise<void>;
    /**
     * Batch move categories
     * @param params Batch move parameters
     * @param teamName The team name (subdomain)
     */
    batchMoveCategory(params: BatchMoveCategoryParams, teamName?: string): Promise<BatchMoveResponse>;
    /**
     * Get tags
     * @param teamName The team name (subdomain)
     */
    getTags(teamName?: string): Promise<TagsResponse>;
    /**
     * Get invitation URL
     * @param teamName The team name (subdomain)
     */
    getInvitationUrl(teamName?: string): Promise<InvitationUrlResponse>;
    /**
     * Regenerate invitation URL
     * @param teamName The team name (subdomain)
     */
    regenerateInvitationUrl(teamName?: string): Promise<InvitationUrlResponse>;
    /**
     * Invite members by email
     * @param params Invitation parameters
     * @param teamName The team name (subdomain)
     */
    inviteMembers(params: InviteMembersParams, teamName?: string): Promise<CreateInvitationsResponse>;
    /**
     * Get pending invitations
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getInvitations(options?: {
        page?: number;
        per_page?: number;
    }, teamName?: string): Promise<InvitationsResponse>;
    /**
     * Delete invitation
     * @param code The invitation code
     * @param teamName The team name (subdomain)
     */
    deleteInvitation(code: string, teamName?: string): Promise<void>;
    /**
     * Get emojis
     * @param includeAll Include all emojis (not just team-specific ones)
     * @param teamName The team name (subdomain)
     */
    getEmojis(includeAll?: boolean, teamName?: string): Promise<EmojisResponse>;
    /**
     * Create a new emoji
     * @param params Emoji parameters
     * @param teamName The team name (subdomain)
     */
    createEmoji(params: CreateEmojiParams, teamName?: string): Promise<CreateEmojiResponse>;
    /**
     * Delete an emoji
     * @param code The emoji code
     * @param teamName The team name (subdomain)
     */
    deleteEmoji(code: string, teamName?: string): Promise<void>;
    /**
     * Get the authenticated user
     * @param includeTeams Include the user's teams
     */
    getAuthenticatedUser(includeTeams?: boolean): Promise<AuthenticatedUser>;
}

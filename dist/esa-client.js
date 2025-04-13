/**
 * ESA API Error class
 */
export class EsaApiError extends Error {
    constructor(status, data) {
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
    /**
     * Create a new ESA API client
     * @param options Client configuration options
     */
    constructor(options) {
        this.baseUrl = 'https://api.esa.io/v1';
        this.token = options.token;
        this.teamName = options.teamName || null;
    }
    /**
     * Set the team name for subsequent requests
     * @param teamName The ESA team name (subdomain)
     */
    setTeamName(teamName) {
        this.teamName = teamName;
    }
    /**
     * Get the current team name
     * @returns The current team name
     */
    getTeamName() {
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
    async request(method, path, params = {}, teamName) {
        const team = teamName || this.teamName;
        // Replace :team_name in the path with the actual team name
        const processedPath = team ? path.replace(':team_name', team) : path;
        // Create the URL with query parameters for GET requests
        let url = `${this.baseUrl}${processedPath}`;
        let body = null;
        let headers = {
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
        }
        else if (params instanceof FormData) {
            body = params;
            // Remove content-type header for FormData to let the browser set it with the boundary
            delete headers['Content-Type'];
        }
        else if (Object.keys(params).length > 0) {
            body = JSON.stringify(params);
        }
        try {
            // Make the request
            const response = await fetch(url, {
                method,
                headers,
                body: body,
            });
            // Check if rate limited
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
                console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
                // Wait for retryAfter seconds
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                // Retry the request
                return this.request(method, path, params, teamName);
            }
            // Handle error responses before trying to parse JSON
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                }
                catch (e) {
                    // JSONパースに失敗した場合はテキストを取得
                    try {
                        const text = await response.text();
                        errorData = { message: text || 'Failed to parse error response' };
                    }
                    catch (textError) {
                        errorData = { message: 'Failed to parse error response' };
                    }
                }
                throw new EsaApiError(response.status, errorData);
            }
            // Parse the response for successful responses
            let data = null;
            if (response.status !== 204) {
                try {
                    data = await response.json();
                }
                catch (e) {
                    // 204以外で内容がない場合は空オブジェクトを返す
                    data = {};
                }
            }
            return data;
        }
        catch (error) {
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
    get(path, params, teamName) {
        return this.request('get', path, params || {}, teamName);
    }
    /**
     * POST request helper
     */
    post(path, params, teamName) {
        return this.request('post', path, params || {}, teamName);
    }
    /**
     * PATCH request helper
     */
    patch(path, params, teamName) {
        return this.request('patch', path, params || {}, teamName);
    }
    /**
     * PUT request helper
     */
    put(path, params, teamName) {
        return this.request('put', path, params || {}, teamName);
    }
    /**
     * DELETE request helper
     */
    delete(path, params, teamName) {
        return this.request('delete', path, params || {}, teamName);
    }
    // Teams API
    /**
     * Get teams the authenticated user belongs to
     * @param role Filter teams by role (owner or member)
     */
    getTeams(role) {
        const params = role ? { role } : {};
        return this.get('/teams', params);
    }
    /**
     * Get specific team
     * @param teamName The team name (subdomain)
     */
    getTeam(teamName) {
        return this.get('/teams/:team_name', {}, teamName);
    }
    /**
     * Get team stats
     * @param teamName The team name (subdomain)
     */
    getTeamStats(teamName) {
        return this.get('/teams/:team_name/stats', {}, teamName);
    }
    // Members API
    /**
     * Get team members
     * @param options Sorting options
     * @param teamName The team name (subdomain)
     */
    getMembers(options, teamName) {
        return this.get('/teams/:team_name/members', options, teamName);
    }
    /**
     * Get a specific member
     * @param screenNameOrEmail The screen name or email of the member
     * @param teamName The team name (subdomain)
     */
    getMember(screenNameOrEmail, teamName) {
        return this.get(`/teams/:team_name/members/${screenNameOrEmail}`, {}, teamName);
    }
    /**
     * Delete a member from team
     * @param screenNameOrEmail The screen name or email of the member
     * @param teamName The team name (subdomain)
     */
    deleteMember(screenNameOrEmail, teamName) {
        return this.delete(`/teams/:team_name/members/${screenNameOrEmail}`, {}, teamName);
    }
    // Posts API
    /**
     * Get posts
     * @param params Request parameters
     * @param teamName The team name (subdomain)
     */
    getPosts(params, teamName) {
        return this.get('/teams/:team_name/posts', params, teamName);
    }
    /**
     * Get a specific post
     * @param postNumber The post number
     * @param include Additional data to include
     * @param teamName The team name (subdomain)
     */
    getPost(postNumber, include, teamName) {
        const params = include ? { include } : {};
        return this.get(`/teams/:team_name/posts/${postNumber}`, params, teamName);
    }
    /**
     * Create a new post
     * @param params Post parameters
     * @param teamName The team name (subdomain)
     */
    createPost(params, teamName) {
        return this.post('/teams/:team_name/posts', { post: params }, teamName);
    }
    /**
     * Update a post
     * @param postNumber The post number
     * @param params Post parameters
     * @param teamName The team name (subdomain)
     */
    updatePost(postNumber, params, teamName) {
        return this.patch(`/teams/:team_name/posts/${postNumber}`, { post: params }, teamName);
    }
    /**
     * Delete a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    deletePost(postNumber, teamName) {
        return this.delete(`/teams/:team_name/posts/${postNumber}`, {}, teamName);
    }
    searchPosts(searchParams) {
        const params = encodeURI(searchParams);
        return this.get('/teams/:team_name/posts/search', { q: params });
    }
    // Comments API
    /**
     * Get comments for a post
     * @param postNumber The post number
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getPostComments(postNumber, options, teamName) {
        return this.get(`/teams/:team_name/posts/${postNumber}/comments`, options, teamName);
    }
    /**
     * Get a specific comment
     * @param commentId The comment ID
     * @param include Additional data to include
     * @param teamName The team name (subdomain)
     */
    getComment(commentId, include, teamName) {
        const params = include ? { include } : {};
        return this.get(`/teams/:team_name/comments/${commentId}`, params, teamName);
    }
    /**
     * Create a comment
     * @param postNumber The post number
     * @param params Comment parameters
     * @param teamName The team name (subdomain)
     */
    createComment(postNumber, params, teamName) {
        return this.post(`/teams/:team_name/posts/${postNumber}/comments`, { comment: params }, teamName);
    }
    /**
     * Update a comment
     * @param commentId The comment ID
     * @param params Comment parameters
     * @param teamName The team name (subdomain)
     */
    updateComment(commentId, params, teamName) {
        return this.patch(`/teams/:team_name/comments/${commentId}`, { comment: params }, teamName);
    }
    /**
     * Delete a comment
     * @param commentId The comment ID
     * @param teamName The team name (subdomain)
     */
    deleteComment(commentId, teamName) {
        return this.delete(`/teams/:team_name/comments/${commentId}`, {}, teamName);
    }
    /**
     * Get all comments in team
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getAllComments(options, teamName) {
        return this.get('/teams/:team_name/comments', options, teamName);
    }
    // Star API
    /**
     * Get stargazers for a post
     * @param postNumber The post number
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getPostStargazers(postNumber, options, teamName) {
        return this.get(`/teams/:team_name/posts/${postNumber}/stargazers`, options, teamName);
    }
    /**
     * Star a post
     * @param postNumber The post number
     * @param params Star parameters
     * @param teamName The team name (subdomain)
     */
    starPost(postNumber, params, teamName) {
        return this.post(`/teams/:team_name/posts/${postNumber}/star`, params, teamName);
    }
    /**
     * Unstar a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    unstarPost(postNumber, teamName) {
        return this.delete(`/teams/:team_name/posts/${postNumber}/star`, {}, teamName);
    }
    /**
     * Get stargazers for a comment
     * @param commentId The comment ID
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getCommentStargazers(commentId, options, teamName) {
        return this.get(`/teams/:team_name/comments/${commentId}/stargazers`, options, teamName);
    }
    /**
     * Star a comment
     * @param commentId The comment ID
     * @param params Star parameters
     * @param teamName The team name (subdomain)
     */
    starComment(commentId, params, teamName) {
        return this.post(`/teams/:team_name/comments/${commentId}/star`, params, teamName);
    }
    /**
     * Unstar a comment
     * @param commentId The comment ID
     * @param teamName The team name (subdomain)
     */
    unstarComment(commentId, teamName) {
        return this.delete(`/teams/:team_name/comments/${commentId}/star`, {}, teamName);
    }
    // Watch API
    /**
     * Get watchers for a post
     * @param postNumber The post number
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getPostWatchers(postNumber, options, teamName) {
        return this.get(`/teams/:team_name/posts/${postNumber}/watchers`, options, teamName);
    }
    /**
     * Watch a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    watchPost(postNumber, teamName) {
        return this.post(`/teams/:team_name/posts/${postNumber}/watch`, {}, teamName);
    }
    /**
     * Unwatch a post
     * @param postNumber The post number
     * @param teamName The team name (subdomain)
     */
    unwatchPost(postNumber, teamName) {
        return this.delete(`/teams/:team_name/posts/${postNumber}/watch`, {}, teamName);
    }
    // Category API
    /**
     * Batch move categories
     * @param params Batch move parameters
     * @param teamName The team name (subdomain)
     */
    batchMoveCategory(params, teamName) {
        return this.post('/teams/:team_name/categories/batch_move', params, teamName);
    }
    // Tags API
    /**
     * Get tags
     * @param teamName The team name (subdomain)
     */
    getTags(teamName) {
        return this.get('/teams/:team_name/tags', {}, teamName);
    }
    // Invitation API
    /**
     * Get invitation URL
     * @param teamName The team name (subdomain)
     */
    getInvitationUrl(teamName) {
        return this.get('/teams/:team_name/invitation', {}, teamName);
    }
    /**
     * Regenerate invitation URL
     * @param teamName The team name (subdomain)
     */
    regenerateInvitationUrl(teamName) {
        return this.post('/teams/:team_name/invitation_regenerator', {}, teamName);
    }
    /**
     * Invite members by email
     * @param params Invitation parameters
     * @param teamName The team name (subdomain)
     */
    inviteMembers(params, teamName) {
        return this.post('/teams/:team_name/invitations', { member: params }, teamName);
    }
    /**
     * Get pending invitations
     * @param options Pagination options
     * @param teamName The team name (subdomain)
     */
    getInvitations(options, teamName) {
        return this.get('/teams/:team_name/invitations', options, teamName);
    }
    /**
     * Delete invitation
     * @param code The invitation code
     * @param teamName The team name (subdomain)
     */
    deleteInvitation(code, teamName) {
        return this.delete(`/teams/:team_name/invitations/${code}`, {}, teamName);
    }
    // Emoji API
    /**
     * Get emojis
     * @param includeAll Include all emojis (not just team-specific ones)
     * @param teamName The team name (subdomain)
     */
    getEmojis(includeAll, teamName) {
        const params = includeAll ? { include: 'all' } : {};
        return this.get('/teams/:team_name/emojis', params, teamName);
    }
    /**
     * Create a new emoji
     * @param params Emoji parameters
     * @param teamName The team name (subdomain)
     */
    createEmoji(params, teamName) {
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
            }
            else {
                formData.append('emoji[image]', params.image);
            }
        }
        return this.request('post', `/teams/:team_name/emojis`, formData, team);
    }
    /**
     * Delete an emoji
     * @param code The emoji code
     * @param teamName The team name (subdomain)
     */
    deleteEmoji(code, teamName) {
        return this.delete(`/teams/:team_name/emojis/${code}`, {}, teamName);
    }
    // User API
    /**
     * Get the authenticated user
     * @param includeTeams Include the user's teams
     */
    getAuthenticatedUser(includeTeams) {
        const params = includeTeams ? { include: 'teams' } : {};
        return this.get('/user', params);
    }
}

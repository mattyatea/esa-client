import { EsaClient, EsaApiError } from '../esa-client';
import { Post, Team, Member, Comment } from '../types';

// Global fetch モックの設定
global.fetch = jest.fn();

describe('EsaClient', () => {
  let client: EsaClient;
  
  beforeEach(() => {
    // テスト前に fetch モックをリセット
    (global.fetch as jest.Mock).mockReset();
    
    // テスト用のクライアントを作成
    client = new EsaClient({
      token: 'test-token',
      sessionToken: 'test-session-token',
      teamName: 'test-team',
    });
  });
  
  // 成功レスポンスのモック作成ヘルパー
  function mockFetchSuccess(data: any) {
    const headers = new Headers();
    const response = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(data),
      headers,
      text: jest.fn().mockResolvedValue(JSON.stringify(data))
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(response);
  }
  
  // エラーレスポンスのモック作成ヘルパー
  function mockFetchError(status: number, data: any) {
    const headers = new Headers();
    const response = {
      ok: false,
      status,
      json: jest.fn().mockResolvedValue(data),
      headers,
      text: jest.fn().mockResolvedValue(JSON.stringify(data))
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(response);
  }

  // レート制限エラーのモック作成ヘルパー
  function mockFetchRateLimit() {
    const headers = new Headers();
    headers.set('retry-after', '1');
    
    const response1 = {
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({ error: 'too_many_requests', message: 'Rate limit exceeded' }),
      headers,
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'too_many_requests', message: 'Rate limit exceeded' }))
    };
    
    const response2 = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
      headers: new Headers(),
      text: jest.fn().mockResolvedValue(JSON.stringify({ success: true }))
    };
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response1)
      .mockResolvedValueOnce(response2);
  }
  
  describe('Teams API', () => {
    test('getTeams should fetch teams', async () => {
      const mockTeams = {
        teams: [
          { name: 'team1', privacy: 'closed' as const, description: 'Team 1', icon: 'icon1', url: 'url1' },
          { name: 'team2', privacy: 'open' as const, description: 'Team 2', icon: 'icon2', url: 'url2' }
        ],
        prev_page: null,
        next_page: null,
        total_count: 2,
        page: 1,
        per_page: 20,
        max_per_page: 100
      };
      
      mockFetchSuccess(mockTeams);
      
      const result = await client.getTeams();
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.esa.io/v1/teams',
        expect.objectContaining({
          method: 'get',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
      
      expect(result).toEqual(mockTeams);
    });
    
    test('getTeam should fetch specific team', async () => {
      const mockTeam = {
        name: 'test-team',
        privacy: 'closed' as const,
        description: 'Test Team',
        icon: 'test-icon',
        url: 'test-url'
      };
      
      mockFetchSuccess(mockTeam);
      
      const result = await client.getTeam();
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.esa.io/v1/teams/test-team',
        expect.any(Object)
      );
      
      expect(result).toEqual(mockTeam);
    });
  });
  
  describe('Posts API', () => {
    test('getPosts should fetch posts with query parameters', async () => {
      const mockPosts = {
        posts: [
          { number: 1, name: 'Post 1', full_name: 'Post 1', wip: false } as Post,
          { number: 2, name: 'Post 2', full_name: 'Post 2', wip: true } as Post
        ],
        prev_page: null,
        next_page: null,
        total_count: 2,
        page: 1,
        per_page: 20,
        max_per_page: 100
      };
      
      mockFetchSuccess(mockPosts);
      
      const result = await client.getPosts({
        q: 'category:general',
        sort: 'updated',
        order: 'desc',
        page: 1,
        per_page: 20
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.esa.io/v1/teams/test-team/posts?q=category%3Ageneral&sort=updated&order=desc&page=1&per_page=20',
        expect.any(Object)
      );
      
      expect(result).toEqual(mockPosts);
    });
    
    test('getPost should fetch a specific post', async () => {
      const mockPost = {
        number: 1,
        name: 'Test Post',
        full_name: 'Test Post',
        wip: false,
        body_md: '# Test',
        body_html: '<h1>Test</h1>',
        created_at: '2020-01-01T00:00:00+09:00',
        updated_at: '2020-01-01T00:00:00+09:00',
        message: 'Create post',
        url: 'https://test-team.esa.io/posts/1',
        tags: ['test'],
        category: 'general',
        revision_number: 1,
        created_by: {
          myself: true,
          name: 'Test User',
          screen_name: 'test',
          icon: 'icon-url'
        },
        updated_by: {
          myself: true,
          name: 'Test User',
          screen_name: 'test',
          icon: 'icon-url'
        }
      } as Post;
      
      mockFetchSuccess(mockPost);
      
      const result = await client.getPost(1);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.esa.io/v1/teams/test-team/posts/1',
        expect.any(Object)
      );
      
      expect(result).toEqual(mockPost);
    });
    
    test('createPost should create a new post', async () => {
      const mockPost = {
        number: 1,
        name: 'New Post',
        full_name: 'New Post',
        wip: true,
        body_md: '# New Post',
        body_html: '<h1>New Post</h1>',
        created_at: '2020-01-01T00:00:00+09:00',
        updated_at: '2020-01-01T00:00:00+09:00',
        message: 'Create post',
        url: 'https://test-team.esa.io/posts/1',
        tags: ['test'],
        category: 'general',
        revision_number: 1
      } as Post;
      
      mockFetchSuccess(mockPost);
      
      const result = await client.createPost({
        name: 'New Post',
        body_md: '# New Post',
        tags: ['test'],
        category: 'general',
        wip: true,
        message: 'Create post'
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.esa.io/v1/teams/test-team/posts',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify({
            post: {
              name: 'New Post',
              body_md: '# New Post',
              tags: ['test'],
              category: 'general',
              wip: true,
              message: 'Create post'
            }
          })
        })
      );
      
      expect(result).toEqual(mockPost);
    });
  });
  
  describe('Comments API', () => {
    test('getPostComments should fetch comments for a post', async () => {
      const mockComments = {
        comments: [
          {
            id: 1,
            body_md: 'Comment 1',
            body_html: '<p>Comment 1</p>',
            created_at: '2020-01-01T00:00:00+09:00',
            updated_at: '2020-01-01T00:00:00+09:00',
            url: 'https://test-team.esa.io/posts/1#comment-1',
            created_by: {
              myself: true,
              name: 'Test User',
              screen_name: 'test',
              icon: 'icon-url'
            },
            stargazers_count: 0,
            star: false
          } as Comment
        ],
        prev_page: null,
        next_page: null,
        total_count: 1,
        page: 1,
        per_page: 20,
        max_per_page: 100
      };
      
      mockFetchSuccess(mockComments);
      
      const result = await client.getPostComments(1);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.esa.io/v1/teams/test-team/posts/1/comments',
        expect.any(Object)
      );
      
      expect(result).toEqual(mockComments);
    });
  });
  
  describe('Error handling', () => {
    test('should throw EsaApiError on error response', async () => {
      // 直接fetchをモック化することで、より確実な動作を保証
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'not_found', message: 'Post not found' }),
          headers: new Headers()
        })
      );
      
      try {
        await client.getPost(999);
        fail('Error should have been thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EsaApiError);
        expect(error).toHaveProperty('status', 404);
        expect(error).toHaveProperty('data', { error: 'not_found', message: 'Post not found' });
      }
    });
    
    test('should handle rate limiting and retry', async () => {
      // レート制限の応答を返す最初のfetchリクエスト
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'too_many_requests', message: 'Rate limit exceeded' }),
          headers: new Headers({
            'retry-after': '1'
          })
        })
      );
      
      // 2回目の成功する応答
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
          headers: new Headers()
        })
      );
      
      const result = await client.getPost(1);
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });
  });
});

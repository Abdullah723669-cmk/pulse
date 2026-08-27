import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const parseAndNormalizeMedia = (mediaUrls: string | null | undefined): any[] => {
  if (!mediaUrls) return [];
  let parsed: any = [];
  try {
    parsed = typeof mediaUrls === 'string' ? JSON.parse(mediaUrls) : mediaUrls;
  } catch {
    if (typeof mediaUrls === 'string' && mediaUrls.trim()) {
      parsed = mediaUrls.split(',').map((u) => u.trim()).filter(Boolean);
    } else {
      parsed = [];
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed
    .map((item: any) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const isVideo = /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(item);
        return {
          url: item,
          type: isVideo ? 'video' : 'image',
        };
      }
      if (typeof item === 'object') {
        const url = item.url || item.src || item.path || '';
        if (!url) return null;
        const isVideo =
          item.type?.toLowerCase() === 'video' ||
          /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(url) ||
          item.mimetype?.startsWith('video/');
        return {
          ...item,
          url,
          type: isVideo ? 'video' : 'image',
        };
      }
      return null;
    })
    .filter(Boolean);
};

export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '15', 10);
    const tab = (req.query.tab as string) || 'foryou';
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (tab === 'following') {
      if (currentUserId) {
        const following = await prisma.follow.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);
        whereClause = {
          authorId: { in: [currentUserId, ...followingIds] },
        };
      } else {
        // Unauthenticated users in following tab have no following list
        res.json({ posts: [], page: 1, hasMore: false });
        return;
      }
    }
    // For 'foryou' tab, whereClause is empty ({}) to show all community posts

    // Fetch posts
    const posts = await prisma.post.findMany({
      where: whereClause,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => {
      const media = parseAndNormalizeMedia(post.mediaUrls);

      return {
        id: post.id,
        content: post.content,
        media,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        bookmarksCount: post._count.bookmarks,
        isLiked: currentUserId ? post.likes.some((l) => l.userId === currentUserId) : false,
        recentComments: post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          user: c.user,
        })),
      };
    });

    res.json({
      posts: formattedPosts,
      page,
      hasMore: formattedPosts.length === limit,
    });
  } catch (error: any) {
    console.error('Feed error:', error);
    res.status(500).json({ message: 'Error retrieving feed.', error: error.message });
  }
};

export const getUserPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const type = req.query.type as string; // 'posts', 'media', 'likes'
    const currentUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    let posts: any[] = [];

    if (type === 'likes') {
      const liked = await prisma.postLike.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                  isVerified: true,
                },
              },
              likes: { select: { userId: true } },
              _count: {
                select: { likes: true, comments: true, bookmarks: true },
              },
            },
          },
        },
      });
      posts = liked.map((l) => l.post).filter(Boolean);
    } else {
      posts = await prisma.post.findMany({
        where: {
          authorId: user.id,
          ...(type === 'media' && {
            NOT: { mediaUrls: '[]' },
          }),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          likes: { select: { userId: true } },
          _count: {
            select: { likes: true, comments: true, bookmarks: true },
          },
        },
      });
    }

    const formattedPosts = posts.map((post) => {
      const media = parseAndNormalizeMedia(post.mediaUrls);

      return {
        id: post.id,
        content: post.content,
        media,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        likesCount: post._count?.likes ?? 0,
        commentsCount: post._count?.comments ?? 0,
        bookmarksCount: post._count?.bookmarks ?? 0,
        isLiked: currentUserId ? post.likes?.some((l: any) => l.userId === currentUserId) : false,
      };
    });

    res.json({ posts: formattedPosts });
  } catch (error: any) {
    console.error('User posts error:', error);
    res.status(500).json({ message: 'Error retrieving user posts.', error: error.message });
  }
};

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const { content, media } = req.body;
    const normalizedMedia = parseAndNormalizeMedia(media);

    if ((!content || !content.trim()) && normalizedMedia.length === 0) {
      res.status(400).json({ message: 'Post cannot be empty. Please include text, an image, or a video.' });
      return;
    }

    const newPost = await prisma.post.create({
      data: {
        authorId: req.user.id,
        content: (content || '').trim(),
        mediaUrls: JSON.stringify(normalizedMedia),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: { likes: true, comments: true, bookmarks: true },
        },
      },
    });

    res.status(201).json({
      message: 'Post created successfully!',
      post: {
        id: newPost.id,
        content: newPost.content,
        media: normalizedMedia,
        createdAt: newPost.createdAt,
        updatedAt: newPost.updatedAt,
        author: newPost.author,
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        isLiked: false,
        recentComments: [],
      },
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post.', error: error.message });
  }
};

export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const { id: postId } = req.params;
    const currentUserId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUserId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });

      const likesCount = await prisma.postLike.count({ where: { postId } });
      res.json({ message: 'Post unliked', isLiked: false, likesCount });
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          postId,
          userId: currentUserId,
        },
      });

      // Notification
      if (post.authorId !== currentUserId) {
        await prisma.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: currentUserId,
            type: 'LIKE',
            entityId: postId,
          },
        });
      }

      const likesCount = await prisma.postLike.count({ where: { postId } });
      res.json({ message: 'Post liked', isLiked: true, likesCount });
    }
  } catch (error: any) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Error updating like.', error: error.message });
  }
};

export const getPostComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    res.json({ comments });
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Error retrieving comments.', error: error.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const { id: postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Comment content cannot be empty.' });
      return;
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: req.user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    // Notify author
    if (post.authorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: req.user.id,
          type: 'COMMENT',
          entityId: postId,
        },
      });
    }

    res.status(201).json({
      message: 'Comment added successfully!',
      comment,
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error adding comment.', error: error.message });
  }
};

export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    if (post.authorId !== req.user.id) {
      res.status(403).json({ message: 'You can only delete your own posts.' });
      return;
    }

    await prisma.post.delete({ where: { id: postId } });
    res.json({ message: 'Post deleted successfully.' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Error deleting post.', error: error.message });
  }
};

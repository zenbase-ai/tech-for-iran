import type { Metadata } from 'next';
import PostsClientPage from './page.client';

export const metadata: Metadata = {
  title: 'Posts | Crackedbook',
};

export default function PostsPage() {
  return <PostsClientPage />;
}

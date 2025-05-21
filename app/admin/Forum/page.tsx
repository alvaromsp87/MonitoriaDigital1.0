"use client";
import Navbar from '../../components/Navbar'; // Caminho correto para Navbar

import { useState } from "react";

interface Comment {
  id: number;
  text: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  comments: Comment[];
}

const Home = () => {
  const userType: 'admin' | 'monitor' | 'student' = 'admin'; // Defina corretamente o tipo de usuário

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      title: "Dúvida sobre JavaScript",
      content: "Alguém pode me explicar closures?",
      created_at: new Date().toISOString(),
      comments: [],
    },
    {
      id: 2,
      title: "Melhores práticas em React",
      content: "Quais são os padrões mais recomendados?",
      created_at: new Date().toISOString(),
      comments: [],
    },
  ]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;

    const newPost: Post = {
      id: posts.length + 1,
      title,
      content,
      created_at: new Date().toISOString(),
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setTitle("");
    setContent("");
  };

  const addComment = (postId: number, commentText: string) => {
    if (!commentText.trim()) return;

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                { id: Date.now(), text: commentText, created_at: new Date().toISOString() },
              ],
            }
          : post
      )
    );
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-[var(--background)] py-12 px-6 sm:px-12">
      <Navbar userType={userType} />

      <div className="container mx-auto max-w-3xl bg-white dark:bg-[var(--card)] p-6 rounded-lg shadow-md dark:border dark:border-[var(--border)]">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-[var(--primary)] text-center mb-6">Fórum de Discussões</h1>

        {/* Formulário de Postagem */}
        <form onSubmit={handleSubmit} className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da Postagem"
            className="border dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] dark:placeholder-[var(--muted-foreground)] p-2 w-full rounded mb-3"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua postagem..."
            className="border dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] dark:placeholder-[var(--muted-foreground)] p-2 w-full rounded mb-3 h-24"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 dark:bg-[var(--primary)] text-white dark:text-[var(--primary-foreground)] py-2 rounded hover:bg-blue-700 dark:hover:bg-[var(--primary-foreground)] transition duration-300"
          >
            Publicar
          </button>
        </form>

        {/* Lista de Postagens */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-50 dark:bg-[var(--secondary)] p-4 rounded-lg shadow dark:border dark:border-[var(--border)]">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-[var(--card-foreground)]">{post.title}</h2>
              <p className="text-gray-600 dark:text-[var(--muted-foreground)] mt-2">{post.content}</p>
              <p className="text-gray-400 dark:text-[var(--muted-foreground)] text-sm mt-4">
                {new Date(post.created_at).toLocaleString()}
              </p>

              {/* Responder postagem */}
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Responda essa dúvida..."
                  className="border dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] dark:placeholder-[var(--muted-foreground)] p-2 w-full rounded mb-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addComment(post.id, (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
              </div>

              {/* Exibir Respostas */}
              {post.comments.length > 0 && (
                <div className="mt-4 border-t dark:border-[var(--border)] pt-2">
                  <h3 className="text-md font-semibold text-gray-700 dark:text-[var(--card-foreground)]">Respostas:</h3>
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="bg-white dark:bg-[var(--card)] p-2 rounded shadow-sm mt-2 dark:border dark:border-[var(--border)]">
                      <p className="text-gray-700 dark:text-[var(--card-foreground)]">{comment.text}</p>
                      <p className="text-gray-400 dark:text-[var(--muted-foreground)] text-xs">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

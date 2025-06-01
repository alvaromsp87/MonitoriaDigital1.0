// 📁 app/admin/Forum/page.tsx
"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { useAuth } from "../../context/AuthContext"; 
import Navbar from '../../components/Navbar'; 
import axios from 'axios'; 
import { Send, MessageSquareText, Loader2, ChevronDown, ChevronUp } from "lucide-react";

// Interfaces
interface AuthorInfo {
  id_usuario_autor: number; 
  nome_autor: string;
}

interface Comment extends AuthorInfo {
  id_comentario: number;
  id_post: number;
  conteudo_comentario: string;
  data_criacao_comentario: string;
}

interface Post extends AuthorInfo {
  id_post: number;
  titulo: string;
  conteudo: string;
  data_criacao: string;
  data_ultima_modificacao: string;
  status_post: string;
  visualizacoes: number;
  total_comentarios: number;
  commentsData?: Comment[]; 
  showComments?: boolean;
  newCommentText?: string; 
  isLoadingComments?: boolean;
  isSubmittingComment?: boolean;
}

export default function ForumPage() {
  const { user } = useAuth(); 
  

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const formatISODate = (isoDateString: string) => {
    if (!isoDateString) return "Data inválida";
    try {
        return new Date(isoDateString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
        });
    } catch (error) {
        console.warn("Erro ao formatar data:", isoDateString, error);
        return "Data inválida";
    }
  };

  const fetchPosts = useCallback(async () => {
    setIsLoadingPage(true);
    setErrorApi(null);
    try {
      // CORRIGIDO AQUI:
      const response = await axios.get<Post[]>("/api/forum"); 
      
      const postsWithInitialState = response.data.map(post => ({
        ...post,
        commentsData: [], 
        showComments: false,
        newCommentText: "",
        isLoadingComments: false,
        isSubmittingComment: false,
      }));
      setPosts(postsWithInitialState);
    } catch (err) {
      console.error("Erro ao buscar posts:", err);
      const errorMsg = axios.isAxiosError(err) && err.response 
                       ? err.response.data.error || "Não foi possível carregar as postagens."
                       : "Não foi possível carregar as postagens.";
      setErrorApi(errorMsg);
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleNewPostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim() || !user) {
      setErrorApi(!user ? "Você precisa estar logado para postar." : "Título e conteúdo são obrigatórios.");
      setTimeout(() => setErrorApi(null), 3000);
      return;
    }
    setIsSubmittingPost(true);
    setErrorApi(null);
    try {
      const response = await axios.post<Post>("/api/forum", { 
        titulo: newPostTitle,
        conteudo: newPostContent,
      });
      const newPostFromApi = {
        ...response.data, 
        commentsData: [], 
        showComments: false, 
        newCommentText: "",
        isLoadingComments: false,
        isSubmittingComment: false,
      };
      setPosts((prevPosts) => [newPostFromApi, ...prevPosts]);
      setNewPostTitle("");
      setNewPostContent("");
    } catch (err) {
      console.error("Erro ao criar post:", err);
      const errorMsg = axios.isAxiosError(err) && err.response
                       ? err.response.data.error || "Falha ao criar a postagem."
                       : "Falha ao criar a postagem. Tente novamente.";
      setErrorApi(errorMsg);
      setTimeout(() => setErrorApi(null), 3000);
    } finally {
      setIsSubmittingPost(false);
    }
  };
  
  const toggleComments = useCallback(async (postId: number) => {
    const postIndex = posts.findIndex(p => p.id_post === postId);
    if (postIndex === -1) return;

    const currentPost = posts[postIndex];
    const newShowCommentsState = !currentPost.showComments;

    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id_post === postId ? { ...p, showComments: newShowCommentsState, isLoadingComments: newShowCommentsState && (!p.commentsData || p.commentsData.length === 0) } : p
      )
    );

    if (newShowCommentsState && (!currentPost.commentsData || currentPost.commentsData.length === 0)) {
      try {
        const response = await axios.get<Comment[]>(`/api/forum/posts/${postId}/comments`);
        setPosts(currentPosts =>
          currentPosts.map(p =>
            p.id_post === postId ? { ...p, commentsData: response.data, isLoadingComments: false } : p
          )
        );
      } catch (err) {
        console.error(`Erro ao buscar comentários para o post ${postId}:`, err);
        setErrorApi(`Erro ao carregar comentários para "${currentPost.titulo}".`);
        setTimeout(() => setErrorApi(null), 4000);
        setPosts(currentPosts =>
          currentPosts.map(p =>
            p.id_post === postId ? { ...p, isLoadingComments: false, showComments: true } : p
          )
        );
      }
    }
  }, [posts]); 
  
  const handleAddComment = useCallback(async (postId: number) => {
    const postIndex = posts.findIndex(p => p.id_post === postId);
    if (postIndex === -1 || !posts[postIndex].newCommentText?.trim() || !user) {
      if (!user) setErrorApi("Você precisa estar logado para comentar.");
      setTimeout(() => setErrorApi(null), 3000);
      return;
    }

    const commentText = posts[postIndex].newCommentText!;
    setPosts(prevPosts => prevPosts.map(p => p.id_post === postId ? {...p, isSubmittingComment: true} : p));
    setErrorApi(null);

    try {
      const response = await axios.post<Comment>(
        `/api/forum/posts/${postId}/comments`,
        { conteudo_comentario: commentText }
      );
      const newCommentFromApi = response.data;

      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id_post === postId
            ? {
                ...p,
                commentsData: [...(p.commentsData || []), newCommentFromApi],
                newCommentText: "", 
                total_comentarios: (p.total_comentarios || 0) + 1,
                isSubmittingComment: false,
              }
            : p
        )
      );
    } catch (err) {
      console.error(`Erro ao adicionar comentário ao post ${postId}:`, err);
      const errorMsg = axios.isAxiosError(err) && err.response
                       ? err.response.data.error || "Falha ao adicionar o comentário."
                       : "Falha ao adicionar o comentário. Tente novamente.";
      setErrorApi(errorMsg);
      setTimeout(() => setErrorApi(null), 4000);
      setPosts(prevPosts => prevPosts.map(p => p.id_post === postId ? {...p, isSubmittingComment: false} : p));
    }
  }, [posts, user]); 

  const handleNewCommentChange = useCallback((postId: number, text: string) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id_post === postId ? { ...p, newCommentText: text } : p
      )
    );
  }, []); 


  if (isLoadingPage && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 flex flex-col items-center justify-center">
        {/* É bom ter o Navbar mesmo na tela de loading, se ele não depender de 'userRole' para renderizar */}
      <Navbar/>
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mt-20" />
        <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">Carregando postagens...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <Navbar/>

      <div className="container mx-auto max-w-3xl">
        <header className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                Fórum de Discussões
            </h1>
            <p className="text-md text-gray-600 dark:text-gray-400 mt-2">
                Compartilhe suas dúvidas e conhecimentos com a comunidade.
            </p>
        </header>
        
        {user && (
          <form onSubmit={handleNewPostSubmit} className="mb-10 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-5">Criar Nova Postagem</h2>
            <div className="mb-4">
              <label htmlFor="newPostTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
              <input
                id="newPostTitle"
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Qual sua dúvida ou o título do tópico?"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="newPostContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteúdo</label>
              <textarea
                id="newPostContent"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Descreva sua postagem em detalhes..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                required
                rows={5}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingPost}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 font-semibold"
            >
              {isSubmittingPost ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publicando...
                </>
              ) : (
                "Publicar Postagem"
              )}
            </button>
          </form>
        )}
        {errorApi && <div role="alert" className="mb-6 p-4 text-sm text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30 rounded-lg text-center">{errorApi}</div>}

        <div className="space-y-8">
          {posts.length === 0 && !isLoadingPage && !errorApi && (
            <div className="text-center py-10">
                <MessageSquareText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Nenhuma postagem encontrada.</p>
                {user && <p className="text-sm text-gray-400 dark:text-gray-500">Seja o primeiro a criar uma!</p>}
            </div>
          )}
          {posts.map((post) => (
            <article key={post.id_post} className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg dark:border dark:border-gray-700">
              <header>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {post.titulo}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                  Postado por <span className="font-medium text-gray-700 dark:text-gray-300">{post.nome_autor || "Autor Desconhecido"}</span> em {formatISODate(post.data_criacao)}
                  {post.data_ultima_modificacao !== post.data_criacao && (
                    <span className="italic"> (editado em {formatISODate(post.data_ultima_modificacao)})</span>
                  )}
                </p>
              </header>
              <div className="prose prose-sm sm:prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {post.conteudo}
              </div>
              
              <footer className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                   <button 
                    onClick={() => toggleComments(post.id_post)}
                    className="flex items-center"
                  >
                    {post.isLoadingComments ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (post.showComments ? <ChevronUp size={18} className="mr-1"/> : <ChevronDown size={18} className="mr-1"/>)}
                    {post.showComments ? "Ocultar" : "Mostrar"} {post.total_comentarios || 0} Respostas
                  </button>

                  {post.showComments && (
                    <section className="mt-4 space-y-4">
                      {user && ( 
                        <form onSubmit={(e) => { e.preventDefault(); handleAddComment(post.id_post);}} className="flex gap-2 items-start">
                          <textarea
                            placeholder="Escreva um comentário..."
                            value={post.newCommentText}
                            onChange={(e) => handleNewCommentChange(post.id_post, e.target.value)}
                            className="flex-grow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            rows={2}
                            required
                          />
                          <button
                            type="submit"
                            disabled={!post.newCommentText?.trim() || post.isSubmittingComment}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md transition duration-150 text-sm disabled:opacity-70 disabled:cursor-not-allowed h-full flex items-center"
                            title="Enviar Comentário"
                          >
                            {post.isSubmittingComment ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send size={18}/>}
                          </button>
                        </form>
                      )}
                      {(post.isLoadingComments && (!post.commentsData || post.commentsData.length === 0)) ? (
                          <div className="flex justify-center items-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400"/>
                            <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">Carregando comentários...</p>
                          </div>
                      ) : (post.commentsData && post.commentsData.length > 0) ? (
                        post.commentsData.map((comment) => (
                          <article key={comment.id_comentario} className="bg-gray-100 dark:bg-gray-700/70 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-600/50">
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{comment.nome_autor || "Usuário"}:</p>
                            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap mt-1">{comment.conteudo_comentario}</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2 text-right">
                              {formatISODate(comment.data_criacao_comentario)}
                            </p>
                          </article>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                      )}
                    </section>
                  )}
              </footer>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
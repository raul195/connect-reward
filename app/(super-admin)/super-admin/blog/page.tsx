"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, FileText, Eye, EyeOff, Clock, Calendar,
} from "lucide-react";
import type { BlogPost } from "@/lib/types";

interface PostForm {
  title: string;
  slug: string;
  description: string;
  content: string;
  author: string;
  category: string;
  tags: string;
  image: string;
  published: boolean;
}

const emptyForm: PostForm = {
  title: "", slug: "", description: "", content: "",
  author: "Connect Reward Team", category: "Getting Started",
  tags: "", image: "", published: false,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/blog");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts as BlogPost[]);
    } catch {
      toast.error("Failed to load blog posts");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditing(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      description: post.description,
      content: post.content,
      author: post.author,
      category: post.category,
      tags: (post.tags || []).join(", "),
      image: post.image || "",
      published: post.published,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title || !form.slug) {
      toast.error("Title and slug are required.");
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title,
      slug: slugify(form.slug),
      description: form.description,
      content: form.content,
      author: form.author,
      category: form.category,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      image: form.image || null,
      published: form.published,
    };

    try {
      const res = await fetch("/api/super-admin/blog", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing, ...payload } : payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save post.");
        setSaving(false);
        return;
      }

      toast.success(editing ? "Post updated!" : "Post created!");
      setModalOpen(false);
      fetchPosts();
    } catch {
      toast.error("Failed to save post.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/super-admin/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete post.");
        return;
      }
      toast.success("Post deleted.");
      setDeleteConfirm(null);
      fetchPosts();
    } catch {
      toast.error("Failed to delete post.");
    }
  }

  async function togglePublish(post: BlogPost) {
    try {
      await fetch("/api/super-admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, published: !post.published }),
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: !p.published } : p))
      );
      toast.success(post.published ? "Post unpublished" : "Post published!");
    } catch {
      toast.error("Failed to update post.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  const published = posts.filter((p) => p.published);
  const drafts = posts.filter((p) => !p.published);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Manager</h1>
          <p className="text-muted-foreground">
            {published.length} published, {drafts.length} drafts
          </p>
        </div>
        <Button onClick={openNew} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-1 h-4 w-4" /> New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No blog posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{post.title}</h3>
                    <Badge
                      variant="outline"
                      className={post.published
                        ? "border-green-300 bg-green-50 text-green-700 shrink-0"
                        : "border-amber-300 bg-amber-50 text-amber-700 shrink-0"
                      }
                    >
                      {post.published ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">
                    /blog/{post.slug} &middot; {post.category}
                    {post.published_at && (
                      <> &middot; {new Date(post.published_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => togglePublish(post)}>
                    {post.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(post)}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteConfirm(post.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({
                      ...f,
                      title,
                      slug: editing ? f.slug : slugify(title),
                    }));
                  }}
                  placeholder="How to Get More Referrals"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="how-to-get-more-referrals"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (for SEO)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="A brief description that appears in search results..."
              />
            </div>

            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={16}
                placeholder={"## Your heading\n\nYour content here. Use **bold**, *italic*, [links](url), etc.\n\n### Subheading\n\n- Bullet point\n- Another point"}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Strategy"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="referrals, solar, tips"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL (optional)</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
              />
              <Label>Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? "Saving..." : editing ? "Update Post" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Post?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

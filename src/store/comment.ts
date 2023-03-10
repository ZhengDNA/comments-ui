import { defineStore } from "pinia";
import { Comments, CommentsView, User } from "../interface";
import * as CommentApi from '../apis/comment'
import * as LikeApi from '../apis/like'
import { useUserStore } from "./user";

export const useCommentStore = defineStore('comment', {
  state() {
    return {
      commentList: [] as Array<Comments>,
      userMap: new Map<number, User>(),
      commentMap: new Map<number, Comments>(),
      reply: null as unknown as number,
      parent: null as unknown as number,
      author: '',
      topComment: -1,
      userLikeMap: new Map<number, any>(),
      userDisLikeMap: new Map<number, any>(),
    }
  },
  actions: {
    async create(context: string, content: string, reply: number, parent: number) {
      const res = await CommentApi.create(context, content, reply, parent)
      if (res.code !== 200) {
        return res.msg
      }
      const userStore = useUserStore();
      this.userMap.set(userStore.user.id, userStore.user)
      this.commentMap.set(res.data.id, res.data)
      if (res.data.parent) {
        let find = this.commentMap.get(res.data.parent)!
        if (!find.subComments) {
          find.subComments = []
        }
        find.subComments.push(res.data)
      } else {
        this.commentList.unshift(res.data)
      }
      this.flush()
      return null
    },
    async del(id: number, parent: number) {
      const res = await CommentApi.del(id)
      if (res.code !== 200) {
        return res.msg
      }
      if (!parent) {
        let ind = this.commentList.findIndex((item) => item.id === id)
        this.commentList.splice(ind, 1)
      } else {
        const p = this.commentList.find((item) => item.id === parent)!
        let ind = p.subComments.findIndex((item) => item.id === id)
        p.subComments.splice(ind, 1)
      }
      this.commentMap.delete(id)
      return null
    },
    async getByContext(context: string) {
      const res = await CommentApi.getByContext(context)
      if (res.code !== 200) {
        return res.msg
      }
      this.topComment = res.data.top
      this.author = res.data.author
      this.commentList = res.data.comments
      for (const user of res.data.users) {
        this.userMap.set(user.id, user)
      }
      for (const userLike of res.data.userLike) {
        this.userLikeMap.set(userLike, {})
      }
      for (const dislike of res.data.userDislike) {
        this.userDisLikeMap.set(dislike, {})
      }
      for (const comment of res.data.comments) {
        this.commentMap.set(comment.id, comment)
        for (const subComment of comment.subComments) {
          this.commentMap.set(subComment.id, subComment)
        }
      }
    },
    async top(id: number) {
      const res = await CommentApi.top(id)
      if (res.code !== 200) {
        return res.msg
      }
      if (res.data > 0) {
        this.topComment = id
      }
    },
    async like(cid: number, type: number) {
      const res = await LikeApi.create(cid, type)
      if (res.code !== 200) {
        return res.msg
      }
      if (res.data < 1) {
        return
      }

      const target = this.commentMap.get(cid)
      if (type == 0) {
        if (this.userLikeMap.delete(cid)) {
          target!.likes -= 1
        }
        target!.dislikes += 1
        this.userDisLikeMap.set(cid, {})
      } else {
        if (this.userDisLikeMap.delete(cid)) {
          target!.dislikes -= 1
        }
        target!.likes += 1
        this.userLikeMap.set(cid, {})
      }
    },
    async deleteLike(cid: number) {
      const res = await LikeApi.del(cid)
      if (res.code !== 200) {
        return res.msg
      }
      if (res.data < 1) {
        return
      }

      const target = this.commentMap.get(cid)
      if (this.userLikeMap.delete(cid)) {
        target!.likes -= 1
      } else if (this.userDisLikeMap.delete(cid)) {
        target!.dislikes -= 1
      }
    },

    getStoreUserByCommentId(id: number): User {
      let comment = this.commentMap.get(id)
      if (!comment) {
        return null!
      }
      return this.userMap.get(comment!.user)!
    },
    flush() {
      this.parent = null as unknown as number
      this.reply = null as unknown as number
    },
    replyTo(reply: number, parent: number) {
      this.reply = reply
      this.parent = parent
    },
  },
  getters: {
    contextComments(state): Array<CommentsView> {
      let res = new Array<CommentsView>()
      for (const comment of state.commentList) {
        let subComments = new Array<CommentsView>()
        if (!comment.subComments) {
          res.push({
            user: state.userMap.get(comment.user)!,
            comment: comment,
            subComments,
            like: state.userLikeMap.has(comment.id),
            dislike: state.userDisLikeMap.has(comment.id)
          })
          continue
        }
        for (const sub of comment.subComments) {
          subComments.push({
            user: state.userMap.get(sub.user)!,
            comment: sub,
            subComments: [],
            like: this.userLikeMap.has(sub.id),
            dislike: this.userDisLikeMap.has(sub.id),
          })
        }
        res.push({
          user: state.userMap.get(comment.user)!,
          comment: comment,
          subComments,
          like: this.userLikeMap.has(comment.id),
          dislike: this.userDisLikeMap.has(comment.id),
        })
      }
      return res;
    },
    count(state): number {
      let res = 0
      for (const comment of state.commentList) {
        comment.subComments && (res += comment.subComments.length)
      }
      res += state.commentList.length
      return res
    },
  }
})
import { defineStore } from "pinia";
import { Comments, CommentsView, User } from "../interface";
import * as CommentApi from '../apis/comment'
import { useUserStore } from "./user";

export const useCommentStore = defineStore('comment', {
  state() {
    return {
      commentList: [] as Array<Comments>,
      userMap: new Map<number, User>(),
      commentMap: new Map<number, Comments>(),
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
      this.commentList.push(res.data)
      this.commentMap.set(res.data.id, res.data)
      return null
    },
    async del(id: number) {
      const res = await CommentApi.del(id)
      if (res.code !== 200) {
        return res.msg
      }
      let ind = this.commentList.findIndex((item) => item.id == id);
      this.commentList.splice(ind, 1)
      this.commentMap.delete(id)
      return null
    },
    async getByContext(context: string) {
      const res = await CommentApi.getByContext(context);
      this.commentList = res.data.comments
      for (const user of res.data.users) {
        this.userMap.set(user.id, user)
      }
      for (const comment of res.data.comments) {
        this.commentMap.set(comment.id, comment)
        for (const subComment of comment.subComments) {
          this.commentMap.set(subComment.id, subComment)
        }
      }
    },
    getStoreUserByCommentId(id: number): User {
      return this.userMap.get(this.commentMap.get(id)!.user)!
    },
  },
  getters: {
    contextComments(state): Array<CommentsView> {
      let res = new Array<CommentsView>()
      for (const comment of state.commentList) {
        let subComments = new Array<CommentsView>()
        for (const sub of comment.subComments) {
          subComments.push({ user: state.userMap.get(sub.user)!, comment: sub, subComments: [] })
        }
        res.push({ user: state.userMap.get(comment.user)!, comment: comment, subComments })
      }
      return res;
    },
    count(state): number {
      let res = 0
      for (const comment of state.commentList) {
        res += comment.subComments.length
      }
      res += state.commentList.length
      return res
    }
  }
})
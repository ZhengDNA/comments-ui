export interface Entity {
  id: number
  ctime: number
  mtime: number
}

export interface User extends Entity {
  nickname: string
  username: string
  password: string
}

export interface Comments extends Entity {
  context: string
  content: string
  reply: number
  parent: number
  user: number
  likes: number
  dislikes: number
  subComments: Array<Comments>
}

export interface Res<R> {
  code: number
  msg: string
  data: R
}

export interface CommentsView {
  comment: Comments
  user: User
  subComments: Array<CommentsView>
  like: boolean
  dislike: boolean
}

export interface GetByContext {
  users: Array<User>
  top: number
  userLike: Array<number>
  userDislike: Array<number>
  comments: Array<Comments>
  author: string
}
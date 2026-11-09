# Security Specification — Bảng Lưu Bút Yêu Thương (Welstory Kids Day 2026)

## 1. Data Invariants

1. **Default Deny Catch-All**: Mọi đường dẫn không được khai báo tường minh trong `/databases/{database}/documents` đều bị từ chối đọc/ghi (`allow read, write: if false;`).
2. **Path Variable Hardening (`isValidId`)**: Mọi thao tác đơn tài liệu (`get`, `create`, `update`, `delete`) trên `/notes/{noteId}` bắt buộc kiểm tra `isValidId(noteId)` (`^[a-zA-Z0-9_\-]+$`, tối đa 128 ký tự). Không dùng `isValidId` trong `list`.
3. **Strict Schema & Key Whitelisting (`isValidMemoryNote`)**:
   - Bắt buộc có đủ và chỉ cho phép 15 trường: `parentName`, `childName`, `department`, `familyIcon`, `noteColor`, `topic`, `promptUsed`, `message`, `photoData`, `photoCaption`, `heartsCount`, `authorUid`, `visibility`, `createdAt`, `updatedAt`.
   - Mọi trường kiểu chuỗi đều có kiểm tra độ dài tối thiểu và tối đa khớp chính xác với `firebase-blueprint.json`.
   - Các trường `familyIcon`, `noteColor`, `topic`, `visibility` bắt buộc thuộc danh sách `enum` hợp lệ.
4. **Temporal Integrity**:
   - Khi `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - Khi `update`: `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`.
5. **Query Enforcer (`allow list`)**:
   - Truy vấn danh sách lưu bút (`list`) bắt buộc lọc theo `resource.data.visibility == 'public'`.
6. **Action-Based Updates**:
   - `update` bắt buộc gọi `isValidMemoryNote(incoming())` đầu tiên và chỉ cho phép 2 hành động:
     - **Action 1 (Thả tim - `isHeartIncrementAction`)**: Chỉ thay đổi `['heartsCount', 'updatedAt']` và tăng `heartsCount` đúng 1 đơn vị (`incoming().heartsCount == existing().heartsCount + 1`).
     - **Action 2 (Chỉnh sửa bởi tác giả đã xác thực hoặc Admin - `isAuthorEditAction`)**: Chỉ thay đổi `['message', 'topic', 'noteColor', 'photoCaption', 'updatedAt']` khi `isSignedIn() && request.auth.token.email_verified == true && existing().authorUid == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection**: Thêm trường lạ `isFeatured: true` khi tạo lưu bút -> Bị chặn bởi `data.keys().hasOnly(...)`.
2. **Oversized Message**: Trường `message` dài 5000 ký tự (vượt quá `maxLength: 1000`) -> Bị chặn bởi `data.message.size() <= 1000`.
3. **Invalid Enum Topic**: Trường `topic` mang giá trị `"hack-topic"` -> Bị chặn bởi kiểm tra `enum`.
4. **Invalid Enum NoteColor**: Trường `noteColor` mang giá trị `"neon-black"` -> Bị chặn bởi kiểm tra `enum`.
5. **Spoofed Initial Hearts**: Tạo lưu bút mới với `heartsCount: 9999` -> Bị chặn bởi `incoming().heartsCount == 0`.
6. **Forged Timestamp on Create**: Tạo lưu bút với `createdAt` trong quá khứ hoặc tương lai -> Bị chặn bởi `incoming().createdAt == request.time`.
7. **Heart Jump Attack**: Cập nhật `heartsCount` tăng thêm 500 trong 1 lần gọi -> Bị chặn bởi `incoming().heartsCount == existing().heartsCount + 1`.
8. **Immutable Field Mutation**: Cố tình đổi `authorUid` hoặc `createdAt` khi `update` -> Bị chặn bởi `affectedKeys().hasOnly(...)` và kiểm tra bất biến.
9. **Unauthorized Content Modification**: Người dùng khác cố sửa `message` của lưu bút -> Bị chặn vì không thỏa `existing().authorUid == request.auth.uid`.
10. **Unverified Email Spoofing**: Tài khoản có `email_verified == false` cố sửa hoặc xóa lưu bút -> Bị chặn bởi `request.auth.token.email_verified == true`.
11. **Malformed Document ID**: Tạo tài liệu với ID chứa ký tự đặc biệt hoặc quá 128 ký tự -> Bị chặn bởi `isValidId(noteId)`.
12. **Unfiltered List Query**: Truy vấn `list` không giới hạn `visibility == 'public'` -> Bị chặn bởi `existing().visibility == 'public'`.

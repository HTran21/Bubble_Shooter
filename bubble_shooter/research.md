# Công nghệ sử dụng

- Vite + Typescript: khởi động nhanh, cấu hình nhẹ.
- Phaser: một HTML5 game framwork mã nguồn mở.Phaser sử dụng Pixi.js để rendering trên WebGL và Canvas.

# Thông tin Game Bubble Shooter

## Hexagon grid

- Game sử dụng bố cục hexagon grid.
- Ưu điểm:

* Các quả bóng xếp khít nhau theo dạng tổ ong.
* Hỗ trợ cơ chế rơi xuống tự nhiên.
* Dễ tính toán va chạm và gắn kết.

## Mục tiêu

- Người chơi điều khiển shooter ở cuối màn hình.
- Bắn bóng lên phía trên để ghép thành cụm >= 3 bóng cùng màu.
- Trò chơi kết thúc khi game chạm đáy.

## Cơ chế game:

- Bắn bóng: người chơi chọn hướng và bắn.
- Va chạm: bóng sẽ gắn vào lưới gần nhất.
- Ghép nhóm: lớn hơn 3 bóng cùng màu thì biến mất.

## Giao diện:

- Shooter: nằm ở giũa phía dưới.
- Lưới bóng: hiển thị phía trên.
- Thanh điểm.

# Thông tin kỹ thuật

## Thuật toán sử dụng BFS:

- Để tìm kiếm các quả bóng cùng màu, chúng ta sử dụng thuật toán tìm kiếm theo chiều rộng(BFS).
- BFS là một thuật toán để duyệt đồ thị hoặc cây:

* BFS tiêu chuẩn sẽ đặt mỗi đỉnh của đồ thị vào một trong hai loại: visited và not visited.
* Mục đích của thuật toán là đánh dấu mỗi đỉnh là đã thăm để tránh các chu trình.
* Cách thuật toán hoạt động như sau:

  1. Lấy một đỉnh bất kỳ trong đồ thị thêm vào cuối hàng đợi.

  2. Lấy phân tử đầu tiên của hàng đợi và thêm nó vào danh sách đã duyệt.
  3. Tạo một danh sách các đỉnh liền kề của đỉnh đang xét. Thêm những đỉnh không có trong danh sách đã duyệt vào cuối hàng đợi.
  4. Tiếp tục lặp lại bước 2 và 3 cho đến khi hàng đợi trống.

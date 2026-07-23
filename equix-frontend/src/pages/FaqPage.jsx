import { Link } from 'react-router-dom';
import './TermsPage.css';

const questions = [
  ['Ai có thể đăng ký tài khoản?', 'Chủ ngựa, Nài ngựa và Khán giả có thể tự đăng ký. Tài khoản Chủ ngựa và Nài ngựa cần Quản trị viên xác minh; tài khoản Khán giả được kích hoạt ngay.'],
  ['Chủ ngựa ghép cặp như thế nào?', 'Chủ ngựa mời một Nài ngựa đang sẵn sàng cho ngựa của mình. Sau khi lời mời được chấp nhận, cặp đang hoạt động có thể đăng ký vào cuộc đua đang mở.'],
  ['Khi nào Khán giả có thể lưu dự đoán?', 'Khán giả có thể lưu một dự đoán ngựa cho mỗi cuộc đua trước trạng thái Chờ xuất phát. Lưu lại sẽ cập nhật dự đoán hiện có.'],
  ['Tại sao thao tác cuộc đua bị vô hiệu hóa?', 'Các thao tác phụ thuộc vào trạng thái. Trọng tài chỉ kiểm tra đăng ký đã sẵn sàng và cuộc đua cần ít nhất sáu cặp đủ điều kiện trước khi chờ xuất phát hoặc bắt đầu.'],
  ['Đăng nhập nhanh là gì?', 'Đăng nhập nhanh là công cụ hỗ trợ demo cục bộ. Khi được bật trong cấu hình, hãy chọn một trong năm nút vai trò trên trang Đăng nhập.'],
  ['EquiX có dùng cá cược thật không?', 'Không. Dự đoán và điểm thưởng của EquiX chỉ là tính năng mô phỏng học thuật, không sử dụng tiền thật.'],
];

function FaqPage() {
  return <div className="terms-page" id="faq-page"><div className="container"><div className="terms-header"><h1 className="terms-title">Câu hỏi thường gặp</h1><p className="terms-updated">Hướng dẫn vai trò và quy trình EquiX</p></div><div className="terms-content"><div className="terms-body">{questions.map(([question, answer], index) => <section key={question} className="terms-section"><h2>{index + 1}. {question}</h2><p>{answer}</p></section>)}</div></div><div className="text-center"><Link to="/races" className="btn btn-primary">Xem cuộc đua</Link></div></div></div>;
}

export default FaqPage;

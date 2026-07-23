import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiGift,
  FiLock,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTag,
  FiTruck,
  FiXCircle,
} from 'react-icons/fi';
import { useAuth } from '../contexts/useAuth';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import { api } from '../services/api';
import { translateText } from '../utils/vietnameseLocalization';
import './DashboardPage.css';
import './RewardCenterPage.css';

const REWARD_STATUSES = [
  'ISSUED',
  'CLAIMED',
  'PROCESSING',
  'SHIPPED',
  'FULFILLED',
  'REDEEMED',
  'EXPIRED',
  'CANCELLED',
];

const TYPE_META = {
  HORSE_GOODS: { label: 'Gói vật phẩm cho ngựa', shortLabel: 'Vật phẩm', icon: <FiPackage /> },
  HORSE_GOODS_PACKAGE: { label: 'Gói vật phẩm cho ngựa', shortLabel: 'Vật phẩm', icon: <FiPackage /> },
  GOODS: { label: 'Gói vật phẩm cho ngựa', shortLabel: 'Vật phẩm', icon: <FiPackage /> },
  VOUCHER: { label: 'Phiếu quà tặng', shortLabel: 'Phiếu quà tặng', icon: <FiTag /> },
  DRINK_COUPON: { label: 'Đồ uống miễn phí', shortLabel: 'Phiếu đồ uống', icon: <FiGift /> },
  COMPLIMENTARY_DRINK: { label: 'Đồ uống miễn phí', shortLabel: 'Phiếu đồ uống', icon: <FiGift /> },
};

function listFrom(response) {
  if (Array.isArray(response)) return response;
  return response?.content || response?.items || response?.rewards || response?.types || [];
}

function typeCodeOf(value) {
  const code = value?.rewardTypeCode
    || value?.typeCode
    || value?.rewardType?.code
    || value?.rewardType
    || value?.type?.code
    || value?.type
    || value?.name;
  return String(code || 'REWARD').toUpperCase();
}

function typeMetaOf(value) {
  const code = typeCodeOf(value);
  return TYPE_META[code] || {
    label: translateText(String(code).replaceAll('_', ' ')),
    shortLabel: translateText(String(code).replaceAll('_', ' ')),
    icon: <FiGift />,
  };
}

function statusOf(reward) {
  return String(reward?.status || 'ISSUED').toUpperCase();
}

function rewardCodeOf(reward) {
  return reward?.redemptionCode || reward?.secureCode || reward?.code || '';
}

function redemptionQrValue(code) {
  const origin = globalThis.location?.origin || 'http://localhost:5173';
  return `${origin}/dashboard/rewards?code=${encodeURIComponent(code)}`;
}

function initialRewardCode() {
  return new URLSearchParams(globalThis.location?.search || '').get('code')?.trim().toUpperCase() || '';
}

function raceNameOf(reward) {
  if (!reward?.raceId) return reward?.title || 'Phần thưởng do quản trị viên cấp';
  return reward?.raceName || reward?.race?.name || `Cuộc đua #${reward?.raceId || '—'}`;
}

function horseNameOf(reward) {
  if (!reward?.horseId) return 'Mã phần thưởng điện tử';
  return reward?.horseName || reward?.horse?.horseName || reward?.horse?.name || `Ngựa #${reward?.horseId || '—'}`;
}

function spectatorNameOf(reward) {
  return reward?.spectatorName
    || reward?.spectator?.fullName
    || reward?.spectator?.username
    || reward?.spectatorEmail
    || `Khán giả #${reward?.spectatorId || '—'}`;
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Chưa thiết lập';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return includeTime ? parsed.toLocaleString('vi-VN') : parsed.toLocaleDateString('vi-VN');
}

function valueOf(reward, ...keys) {
  for (const key of keys) {
    if (reward?.[key] !== null && reward?.[key] !== undefined && reward?.[key] !== '') return reward[key];
  }
  return '';
}

function hydrateRewards(rewards, races = [], horses = [], users = []) {
  return rewards.map((reward) => {
    const race = races.find((item) => Number(item.id) === Number(reward.raceId));
    const horse = horses.find((item) => Number(item.id) === Number(reward.horseId));
    const spectator = users.find((item) => Number(item.id) === Number(reward.userId || reward.spectatorId));
    return {
      ...reward,
      spectatorId: reward.spectatorId || reward.userId,
      raceName: reward.raceName || race?.name,
      horseName: reward.horseName || horse?.horseName,
      spectatorName: reward.spectatorName || spectator?.fullName || spectator?.username,
      spectatorEmail: reward.spectatorEmail || spectator?.email,
    };
  });
}

function RewardStatus({ status }) {
  const normalized = String(status || 'ISSUED').toUpperCase();
  const positive = ['FULFILLED', 'REDEEMED'].includes(normalized);
  const negative = ['EXPIRED', 'CANCELLED'].includes(normalized);
  const transit = normalized === 'SHIPPED';
  const tone = positive ? 'positive' : negative ? 'negative' : transit ? 'transit' : 'pending';
  return <span className={`reward-status ${tone}`}>{translateText(normalized.replaceAll('_', ' '))}</span>;
}

function RewardSummary({ rewards, admin = false }) {
  const counts = rewards.reduce((current, reward) => {
    const status = statusOf(reward);
    current[status] = (current[status] || 0) + 1;
    return current;
  }, {});

  const cards = admin
    ? [
      { label: 'Phần thưởng mới', value: counts.ISSUED || 0, icon: <FiGift />, tone: 'red' },
      { label: 'Chờ xử lý', value: counts.CLAIMED || 0, icon: <FiClock />, tone: 'yellow' },
      { label: 'Đang xử lý', value: (counts.PROCESSING || 0) + (counts.SHIPPED || 0), icon: <FiTruck />, tone: 'blue' },
      { label: 'Đã hoàn thành', value: (counts.FULFILLED || 0) + (counts.REDEEMED || 0), icon: <FiCheckCircle />, tone: 'green' },
    ]
    : [
      { label: 'Có thể nhận', value: counts.ISSUED || 0, icon: <FiGift />, tone: 'red' },
      { label: 'Đã nhận', value: counts.CLAIMED || 0, icon: <FiClock />, tone: 'yellow' },
      { label: 'Đang giao', value: (counts.PROCESSING || 0) + (counts.SHIPPED || 0), icon: <FiTruck />, tone: 'blue' },
      { label: 'Đã nhận và sử dụng', value: (counts.FULFILLED || 0) + (counts.REDEEMED || 0), icon: <FiCheckCircle />, tone: 'green' },
    ];

  return (
    <div className="reward-summary-grid" aria-label="Tóm tắt phần thưởng">
      {cards.map((card) => (
        <article className={`reward-summary-card ${card.tone}`} key={card.label}>
          <span className="reward-summary-icon">{card.icon}</span>
          <div><strong>{card.value}</strong><span>{card.label}</span></div>
        </article>
      ))}
    </div>
  );
}

function RewardToolbar({ query, setQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter, resultCount }) {
  return (
    <div className="reward-toolbar">
      <label className="form-field reward-toolbar-field reward-search-field">
        <span className="form-field-label">Tìm phần thưởng</span>
        <span className="reward-search">
          <FiSearch aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo phần thưởng hoặc người nhận"
          />
        </span>
      </label>
      <label className="form-field reward-toolbar-field">
        <span className="form-field-label">Loại phần thưởng</span>
        <select className="form-select compact" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="ALL">Tất cả loại phần thưởng</option>
          <option value="HORSE_GOODS">Vật phẩm cho ngựa</option>
          <option value="VOUCHER">Phiếu quà tặng</option>
          <option value="DRINK_COUPON">Phiếu đồ uống</option>
        </select>
      </label>
      <label className="form-field reward-toolbar-field">
        <span className="form-field-label">Trạng thái phần thưởng</span>
        <select className="form-select compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          {REWARD_STATUSES.map((status) => <option value={status} key={status}>{translateText(status.replaceAll('_', ' '))}</option>)}
        </select>
      </label>
      <span className="reward-result-count">{resultCount} kết quả</span>
    </div>
  );
}

function EmptyRewards({ admin = false }) {
  return (
    <div className="reward-empty">
      <span><FiGift /></span>
      <h2>{admin ? 'Không có phần thưởng nào cần xử lý.' : 'Không tìm thấy phần thưởng.'}</h2>
      <p>{admin ? 'Phần thưởng mới của khán giả sẽ xuất hiện sau khi kết quả cuộc đua được công bố chính thức.' : 'Phần thưởng từ dự đoán đúng sẽ xuất hiện tại đây sau khi kết quả được công bố chính thức.'}</p>
    </div>
  );
}

function SpectatorRewardCenter({ user }) {
  const { refreshUser, refreshUnreadCount } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const pointBalance = Number(user?.rewardPoints || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeClaimId, setActiveClaimId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [redeemCode, setRedeemCode] = useState(initialRewardCode);
  const [claimForm, setClaimForm] = useState({
    recipientName: user?.fullName || user?.name || '',
    recipientPhone: user?.phone || '',
    deliveryAddress: '',
    spectatorNote: '',
  });

  const loadRewards = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [rewardResponse, raceResponse, horseResponse, catalogResponse] = await Promise.all([
        api.getRewards(),
        api.getRaces(),
        api.getHorses(),
        api.getPointRewardCatalog(),
      ]);
      setRewards(hydrateRewards(listFrom(rewardResponse), listFrom(raceResponse), listFrom(horseResponse)));
      setCatalog(listFrom(catalogResponse));
      setError('');
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể tải phần thưởng của bạn.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadRewards(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadRewards]);

  const filteredRewards = useMemo(() => rewards.filter((reward) => {
    const typeCode = typeCodeOf(reward);
    const normalizedType = typeCode.includes('GOODS') ? 'HORSE_GOODS' : typeCode;
    const searchable = [
      raceNameOf(reward),
      horseNameOf(reward),
      typeMetaOf(reward).label,
      statusOf(reward),
      rewardCodeOf(reward),
    ].join(' ').toLowerCase();
    return searchable.includes(query.toLowerCase())
      && (statusFilter === 'ALL' || statusOf(reward) === statusFilter)
      && (typeFilter === 'ALL' || normalizedType === typeFilter);
  }), [query, rewards, statusFilter, typeFilter]);

  const openClaimForm = (rewardId) => {
    setActiveClaimId((current) => current === rewardId ? null : rewardId);
    setError('');
    setSuccess('');
  };

  const claimReward = async (reward, payload) => {
    setActionId(reward.id);
    setError('');
    setSuccess('');
    try {
      await api.claimReward(reward.id, payload);
      setSuccess(`Đã nhận ${typeMetaOf(reward).label}.`);
      setActiveClaimId(null);
      await loadRewards({ silent: true });
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể nhận phần thưởng này.'));
    } finally {
      setActionId(null);
    }
  };

  const submitGoodsClaim = (event, reward) => {
    event.preventDefault();
    claimReward(reward, claimForm);
  };

  const confirmReceived = async (reward) => {
    setActionId(reward.id);
    setError('');
    setSuccess('');
    try {
      await api.confirmRewardReceived(reward.id);
      setSuccess('Đã xác nhận nhận hàng. Chúc bạn tận hưởng phần thưởng!');
      await loadRewards({ silent: true });
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể xác nhận giao hàng.'));
    } finally {
      setActionId(null);
    }
  };

  const copyCode = async (reward) => {
    const code = rewardCodeOf(reward);
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(reward.id);
      setSuccess('Đã sao chép mã đổi thưởng.');
    } catch {
      setError('Trình duyệt không hỗ trợ sao chép tự động. Vui lòng chọn mã và sao chép thủ công.');
    }
  };

  const redeemIssuedCode = async (event) => {
    event.preventDefault();
    setActionId('redeem-code');
    setError('');
    setSuccess('');
    try {
      const redeemed = await api.redeemRewardCode(redeemCode.trim().toUpperCase());
      setSuccess(`Đã đổi ${redeemed.title || 'mã phần thưởng'} thành công.`);
      setRedeemCode('');
      await refreshUnreadCount();
      await loadRewards({ silent: true });
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể đổi mã phần thưởng này.'));
    } finally {
      setActionId(null);
    }
  };

  const exchangePoints = async (item) => {
    const pointCost = Number(item.pointCost || 0);
    if (!window.confirm(`Dùng ${pointCost.toLocaleString('vi-VN')} point để đổi ${typeMetaOf(item).label}?`)) return;
    setActionId(`exchange-${item.id}`);
    setError('');
    setSuccess('');
    try {
      const exchanged = await api.exchangeRewardPoints(item.id);
      const code = rewardCodeOf(exchanged);
      await refreshUser();
      setRedeemCode(code);
      setSuccess(`Đổi thưởng thành công. Mã quà tặng của bạn là ${code}. Mã cũng đã được gửi vào Thông báo.`);
      await refreshUnreadCount();
      await loadRewards({ silent: true });
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể đổi point lấy phần thưởng này.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="dashboard-page reward-center-page" id="spectator-reward-center">
      <header className="dash-header dash-header-row reward-page-header">
        <div className="reward-title-wrap">
          <span className="reward-title-icon"><FiGift /></span>
          <div>
            <h1 className="dash-title">Phần thưởng của tôi</h1>
            <p className="dash-subtitle">Nhận phần thưởng, theo dõi giao hàng và bảo mật mã đổi thưởng điện tử của bạn.</p>
          </div>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => loadRewards()} disabled={loading}>
          <FiRefreshCw className={loading ? 'reward-spin' : ''} /> Làm mới
        </button>
      </header>

      <ToastNotification
        message={error || success}
        type={error ? 'error' : 'success'}
        onDismiss={() => { setError(''); setSuccess(''); }}
      />

      <RewardSummary rewards={rewards} />

      <section className="workflow-panel point-reward-catalog">
        <div className="workflow-panel-heading">
          <div><h3>Đổi point lấy mã quà tặng</h3><p>Chọn phần thưởng điện tử; point được trừ ngay và mã dùng một lần sẽ gửi vào Thông báo.</p></div>
          <strong className="point-balance"><FiTag /> {pointBalance.toLocaleString('vi-VN')} point</strong>
        </div>
        <div className="point-reward-grid">
          {catalog.map((item) => {
            const meta = typeMetaOf(item);
            const pointCost = Number(item.pointCost || 0);
            const exchanging = actionId === `exchange-${item.id}`;
            return (
              <article className="point-reward-card" key={item.id}>
                <span className="reward-type-icon">{meta.icon}</span>
                <div><span className="reward-type-label">{meta.label}</span><h4>{item.description || meta.label}</h4><p>Mã có hiệu lực {item.validityDays || 30} ngày · dùng một lần</p></div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => exchangePoints(item)} disabled={Boolean(actionId) || pointBalance < pointCost}>
                  {exchanging ? <span className="spinner" /> : <FiGift />} {pointBalance < pointCost ? 'Không đủ point' : `Đổi ${pointCost.toLocaleString('vi-VN')} point`}
                </button>
              </article>
            );
          })}
          {!loading && catalog.length === 0 && <p className="workflow-muted inline">Hiện chưa có phần thưởng điện tử nào để đổi bằng point.</p>}
        </div>
      </section>

      <form className="workflow-panel reward-redeem-panel spectator-code-panel" onSubmit={redeemIssuedCode}>
        <div className="workflow-panel-heading"><div><h3>Đổi mã phần thưởng</h3><p>Nhập mã dùng một lần được tạo cho tài khoản khán giả của bạn.</p></div><FiTag /></div>
        <div className="reward-redeem-grid spectator">
          <label>Mã phần thưởng<input className="form-input reward-code-input" value={redeemCode}
            onChange={(event) => setRedeemCode(event.target.value.toUpperCase())} placeholder="EQUIX-VCH-..." required autoComplete="off" /></label>
          <button className="btn btn-primary" disabled={actionId === 'redeem-code' || !redeemCode.trim()}>
            {actionId === 'redeem-code' ? <span className="spinner" /> : <FiGift />} Đổi mã
          </button>
        </div>
      </form>

      <section className="workflow-panel unframed reward-list-panel">
        <RewardToolbar
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          resultCount={filteredRewards.length}
        />

        {loading ? (
          <div className="reward-loading"><span className="spinner spinner-lg" /><span>Đang tải phần thưởng...</span></div>
        ) : filteredRewards.length === 0 ? <EmptyRewards /> : (
          <div className="reward-card-grid">
            {filteredRewards.map((reward) => {
              const typeCode = typeCodeOf(reward);
              const meta = typeMetaOf(reward);
              const status = statusOf(reward);
              const isShipping = Boolean(reward.requiresShipping) || typeCode.includes('GOODS');
              const isDigital = !isShipping;
              const code = rewardCodeOf(reward);
              const provider = valueOf(reward, 'partnerName', 'provider', 'rewardProvider');
              const terms = valueOf(reward, 'terms', 'termsAndConditions') || reward.rewardType?.terms;
              const expiresAt = valueOf(reward, 'expiresAt', 'expirationDate');
              const trackingNumber = valueOf(reward, 'trackingNumber');
              const carrier = valueOf(reward, 'carrier');
              const merchandiseUrl = valueOf(reward, 'redemptionUrl', 'merchandiseUrl', 'externalUrl');
              const imageUrl = valueOf(reward, 'imageUrl');
              const contactInfo = valueOf(reward, 'contactInfo');
              const canRevealCode = isDigital && status !== 'ISSUED' && status !== 'CANCELLED';

              return (
                <article className="reward-card" data-reward-type={typeCode} key={reward.id}>
                  <div className="reward-card-accent" />
                  <header className="reward-card-header">
                    <span className="reward-type-icon">{meta.icon}</span>
                    <div className="reward-card-heading">
                      <span className="reward-type-label">{meta.label}</span>
                      <h2>{raceNameOf(reward)}</h2>
                      <p>{horseNameOf(reward)}{reward.finishPosition ? ` · về đích hạng #${reward.finishPosition}` : ''}</p>
                    </div>
                    <RewardStatus status={status} />
                  </header>

                  {imageUrl && isShipping && <img className="reward-card-image" src={imageUrl} alt={`Ảnh ${meta.label}`} />}

                  <p className="reward-description">{reward.description || reward.rewardTypeDescription || reward.rewardDescription || 'Phần thưởng chính thức cho dự đoán đúng của bạn.'}</p>

                  <dl className="reward-meta-grid">
                    <div><dt>Ngày phát hành</dt><dd>{formatDate(valueOf(reward, 'awardedAt', 'issuedAt', 'createdAt'))}</dd></div>
                    <div><dt>Ngày hết hạn</dt><dd>{formatDate(expiresAt)}</dd></div>
                    <div><dt>Nhà cung cấp</dt><dd>{provider || 'EquiX'}</dd></div>
                    <div><dt>Mã phần thưởng</dt><dd>#{reward.id}</dd></div>
                  </dl>

                  {canRevealCode && (
                    <>
                      <div className="reward-code-box">
                        <div><span>Mã đổi thưởng bảo mật</span><code>{code || 'Mã đang được chuẩn bị'}</code></div>
                        {code && <button type="button" onClick={() => copyCode(reward)} aria-label={`Sao chép mã ${code}`}><FiCopy /> {copiedId === reward.id ? 'Đã sao chép' : 'Sao chép'}</button>}
                      </div>
                      {code && (
                        <div className="reward-qr-box">
                          <QRCodeSVG value={redemptionQrValue(code)} size={132} level="M" title={`Mã QR đổi thưởng ${code}`} />
                          <div><strong>Quét để đổi thưởng</strong><span>Mã QR mở trang đổi thưởng bảo mật của quản trị viên và tự điền mã dùng một lần này.</span></div>
                        </div>
                      )}
                    </>
                  )}

                  {!isDigital && trackingNumber && (
                    <div className="reward-tracking">
                      <FiTruck />
                      <div><span>{carrier || 'Đơn vị vận chuyển'}</span><strong>{trackingNumber}</strong></div>
                    </div>
                  )}

                  {terms && <details className="reward-terms"><summary>Điều khoản và chi tiết đổi thưởng</summary><p>{terms}</p></details>}
                  {contactInfo && <p className="reward-contact"><strong>Liên hệ:</strong> {contactInfo}</p>}

                  <div className="reward-card-actions">
                    {status === 'ISSUED' && isDigital && (
                      <button type="button" className="btn btn-primary" disabled={actionId === reward.id} onClick={() => claimReward(reward, {})}>
                        {actionId === reward.id ? <span className="spinner" /> : <FiGift />} Nhận phần thưởng điện tử
                      </button>
                    )}
                    {status === 'ISSUED' && !isDigital && (
                      <button type="button" className="btn btn-primary" onClick={() => openClaimForm(reward.id)} aria-expanded={activeClaimId === reward.id}>
                        <FiPackage /> {activeClaimId === reward.id ? 'Đóng biểu mẫu nhận thưởng' : 'Yêu cầu giao phần thưởng'}
                      </button>
                    )}
                    {status === 'SHIPPED' && !isDigital && (
                      <button type="button" className="btn btn-secondary" disabled={actionId === reward.id} onClick={() => confirmReceived(reward)}>
                        {actionId === reward.id ? <span className="spinner" /> : <FiCheckCircle />} Xác nhận đã nhận
                      </button>
                    )}
                    {merchandiseUrl && (
                      <a className="btn btn-outline" href={merchandiseUrl} target="_blank" rel="noreferrer">Xem phần thưởng <FiExternalLink /></a>
                    )}
                  </div>

                  {activeClaimId === reward.id && (
                    <form className="reward-claim-form" onSubmit={(event) => submitGoodsClaim(event, reward)}>
                      <div className="reward-form-heading"><FiPackage /><div><h3>Thông tin giao hàng</h3><p>Quản trị viên chỉ dùng thông tin này để giao phần thưởng.</p></div></div>
                      <div className="reward-form-grid">
                        <label>Tên người nhận<input className="form-input" value={claimForm.recipientName} onChange={(event) => setClaimForm({ ...claimForm, recipientName: event.target.value })} required maxLength="120" /></label>
                        <label>Số điện thoại<input className="form-input" type="tel" value={claimForm.recipientPhone} onChange={(event) => setClaimForm({ ...claimForm, recipientPhone: event.target.value })} required maxLength="30" /></label>
                        <label className="wide">Địa chỉ giao hàng<textarea className="form-input" value={claimForm.deliveryAddress} onChange={(event) => setClaimForm({ ...claimForm, deliveryAddress: event.target.value })} required minLength="10" maxLength="500" /></label>
                        <label className="wide">Ghi chú xử lý (không bắt buộc)<textarea className="form-input" value={claimForm.spectatorNote} onChange={(event) => setClaimForm({ ...claimForm, spectatorNote: event.target.value })} maxLength="500" /></label>
                      </div>
                      <button className="btn btn-primary" disabled={actionId === reward.id}>
                        {actionId === reward.id ? <span className="spinner" /> : <FiCheckCircle />} Gửi yêu cầu nhận thưởng
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminRewardCenter() {
  const [rewards, setRewards] = useState([]);
  const [rewardTypes, setRewardTypes] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [fulfillmentDrafts, setFulfillmentDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [actionKey, setActionKey] = useState('');
  const [codeForm, setCodeForm] = useState({
    spectatorId: '', rewardTypeId: '', title: '', description: '', validityDays: 30,
  });

  const loadAdminData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [rewardResponse, typeResponse, raceResponse, horseResponse, userResponse] = await Promise.all([
        api.getAdminRewards(),
        api.getRewardTypes(),
        api.getRaces(),
        api.getHorses(),
        api.getUsers(),
      ]);
      const nextRewards = hydrateRewards(
        listFrom(rewardResponse),
        listFrom(raceResponse),
        listFrom(horseResponse),
        listFrom(userResponse),
      );
      const nextTypes = listFrom(typeResponse);
      const nextSpectators = listFrom(userResponse).filter((account) => account.role === 'SPECTATOR'
        && ['VERIFIED', 'ACTIVE'].includes(account.status));
      const nextDigitalTypes = nextTypes.filter((type) => type.active !== false && !type.requiresShipping);
      setRewards(nextRewards);
      setRewardTypes(nextTypes);
      setSpectators(nextSpectators);
      setCodeForm((current) => ({
        ...current,
        spectatorId: nextSpectators.some((account) => Number(account.id) === Number(current.spectatorId))
          ? current.spectatorId : nextSpectators[0]?.id || '',
        rewardTypeId: nextDigitalTypes.some((type) => Number(type.id) === Number(current.rewardTypeId))
          ? current.rewardTypeId : nextDigitalTypes[0]?.id || '',
      }));
      setError('');
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể tải dữ liệu xử lý phần thưởng.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadAdminData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAdminData]);

  const filteredRewards = useMemo(() => rewards.filter((reward) => {
    const typeCode = typeCodeOf(reward);
    const normalizedType = typeCode.includes('GOODS') ? 'HORSE_GOODS' : typeCode;
    const searchable = [
      spectatorNameOf(reward),
      reward.spectatorEmail,
      raceNameOf(reward),
      horseNameOf(reward),
      rewardCodeOf(reward),
      valueOf(reward, 'recipientPhone'),
      valueOf(reward, 'trackingNumber'),
    ].join(' ').toLowerCase();
    return searchable.includes(query.toLowerCase())
      && (statusFilter === 'ALL' || statusOf(reward) === statusFilter)
      && (typeFilter === 'ALL' || normalizedType === typeFilter);
  }), [query, rewards, statusFilter, typeFilter]);

  const updateFulfillmentDraft = (rewardId, field, value) => {
    setFulfillmentDrafts((current) => ({
      ...current,
      [rewardId]: { ...(current[rewardId] || {}), [field]: value },
    }));
  };

  const runFulfillment = async (reward, action) => {
    const draft = fulfillmentDrafts[reward.id] || {};
    setActionKey(`${reward.id}-${action}`);
    setError('');
    setSuccess('');
    try {
      await api.updateRewardFulfillment(reward.id, {
        action,
        carrier: draft.carrier || '',
        trackingNumber: draft.trackingNumber || '',
        adminNote: draft.adminNote || '',
      });
      setSuccess(`Đã cập nhật phần thưởng #${reward.id}.`);
      await loadAdminData({ silent: true });
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể cập nhật quá trình xử lý phần thưởng.'));
    } finally {
      setActionKey('');
    }
  };

  const createRewardCode = async (event) => {
    event.preventDefault();
    const targetSpectator = spectators.find((account) => Number(account.id) === Number(codeForm.spectatorId));
    setActionKey('create-code');
    setError('');
    setSuccess('');
    try {
      const created = await api.createRewardCode({
        spectatorId: Number(codeForm.spectatorId),
        rewardTypeId: Number(codeForm.rewardTypeId),
        title: codeForm.title.trim(),
        description: codeForm.description.trim(),
        validityDays: Number(codeForm.validityDays),
      });
      setSuccess(`Đã tạo mã ${created.redemptionCode} cho ${targetSpectator?.fullName || targetSpectator?.email || 'khán giả đã chọn'}.`);
      setCodeForm((current) => ({ ...current, title: '', description: '' }));
      await loadAdminData({ silent: true });
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể tạo mã phần thưởng này.'));
    } finally {
      setActionKey('');
    }
  };

  return (
    <div className="dashboard-page reward-center-page" id="admin-reward-center">
      <header className="dash-header dash-header-row reward-page-header">
        <div className="reward-title-wrap">
          <span className="reward-title-icon admin"><FiShield /></span>
          <div>
            <h1 className="dash-title">Xử lý phần thưởng</h1>
            <p className="dash-subtitle">Tạo mã phần thưởng cho khán giả và xử lý giao phần thưởng hiện vật.</p>
          </div>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => loadAdminData()} disabled={loading}>
          <FiRefreshCw className={loading ? 'reward-spin' : ''} /> Làm mới
        </button>
      </header>

      <ToastNotification
        message={error || success}
        type={error ? 'error' : 'success'}
        onDismiss={() => { setError(''); setSuccess(''); }}
      />

      <RewardSummary rewards={rewards} admin />

      <section className="reward-admin-tools">
        <form className="workflow-panel reward-redeem-panel" onSubmit={createRewardCode}>
          <div className="workflow-panel-heading"><div><h3>Tạo mã phần thưởng cho khán giả</h3><p>Mã dùng một lần vừa tạo sẽ được thêm ngay vào danh sách xử lý.</p></div><FiGift /></div>
          <div className="reward-code-create-grid">
            <label>Khán giả<select className="form-select" value={codeForm.spectatorId} onChange={(event) => setCodeForm({ ...codeForm, spectatorId: event.target.value })} required>
              <option value="">Chọn khán giả</option>
              {spectators.map((account) => <option value={account.id} key={account.id}>{account.fullName || account.username} — {account.email}</option>)}
            </select></label>
            <label>Loại phần thưởng điện tử<select className="form-select" value={codeForm.rewardTypeId} onChange={(event) => setCodeForm({ ...codeForm, rewardTypeId: event.target.value })} required>
              <option value="">Chọn loại phần thưởng</option>
              {rewardTypes.filter((type) => type.active !== false && !type.requiresShipping).map((type) => <option value={type.id} key={type.id}>{typeMetaOf(type).label}</option>)}
            </select></label>
            <label>Hiệu lực (ngày)<input className="form-input" type="number" min="1" max="3650" value={codeForm.validityDays} onChange={(event) => setCodeForm({ ...codeForm, validityDays: event.target.value })} required /></label>
            <label>Tên phần thưởng<input className="form-input" value={codeForm.title} onChange={(event) => setCodeForm({ ...codeForm, title: event.target.value })} placeholder="Ví dụ: Phiếu quà tặng thuyết trình" maxLength="255" required /></label>
            <label className="wide">Mô tả<textarea className="form-input" value={codeForm.description} onChange={(event) => setCodeForm({ ...codeForm, description: event.target.value })} placeholder="Khán giả có thể đổi phần thưởng gì?" maxLength="2000" /></label>
            <button className="btn btn-primary" disabled={actionKey === 'create-code' || !spectators.length}>
              {actionKey === 'create-code' ? <span className="spinner" /> : <FiGift />} Tạo mã phần thưởng
            </button>
          </div>
        </form>
      </section>

      <section className="workflow-panel unframed reward-list-panel">
        <div className="reward-section-title"><div><h2>Danh sách xử lý</h2><p>Chỉ hiển thị các thao tác hợp lệ theo trạng thái của từng phần thưởng.</p></div></div>
        <RewardToolbar
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          resultCount={filteredRewards.length}
        />

        {loading ? (
          <div className="reward-loading"><span className="spinner spinner-lg" /><span>Đang tải danh sách xử lý...</span></div>
        ) : filteredRewards.length === 0 ? <EmptyRewards admin /> : (
          <div className="workflow-table-wrap">
            <table className="data-table reward-admin-table">
              <thead><tr><th>Khán giả</th><th>Phần thưởng</th><th>Trạng thái</th><th>Nhận và giao hàng</th><th>Thao tác</th></tr></thead>
              <tbody>
                {filteredRewards.map((reward) => {
                  const typeCode = typeCodeOf(reward);
                  const status = statusOf(reward);
                  const isGoods = Boolean(reward.requiresShipping) || typeCode.includes('GOODS');
                  const draft = fulfillmentDrafts[reward.id] || {};
                  const currentTracking = valueOf(reward, 'trackingNumber');
                  const currentCarrier = valueOf(reward, 'carrier');
                  const canFulfill = isGoods && ['CLAIMED', 'PROCESSING', 'SHIPPED'].includes(status);
                  const canCancel = !['FULFILLED', 'REDEEMED', 'EXPIRED', 'CANCELLED'].includes(status);
                  const canManage = canFulfill || canCancel;
                  return (
                    <tr key={reward.id}>
                      <td><strong>{spectatorNameOf(reward)}</strong><small>{reward.spectatorEmail || `Mã #${reward.spectatorId || '—'}`}</small></td>
                      <td><strong>{typeMetaOf(reward).shortLabel}</strong><small>{raceNameOf(reward)} · {horseNameOf(reward)}</small></td>
                      <td><RewardStatus status={status} /><small>Phát hành {formatDate(valueOf(reward, 'awardedAt', 'issuedAt', 'createdAt'))}</small></td>
                      <td>
                        <strong>{valueOf(reward, 'recipientName') || (!isGoods ? rewardCodeOf(reward) || 'Chưa nhận' : 'Chưa nhận')}</strong>
                        <small>{valueOf(reward, 'recipientPhone') || currentCarrier || 'Chưa có thông tin xử lý'}</small>
                        {(valueOf(reward, 'deliveryAddress') || currentTracking) && <small>{valueOf(reward, 'deliveryAddress') || `Mã vận đơn: ${currentTracking}`}</small>}
                      </td>
                      <td>
                        {canManage ? (
                          <details className="reward-admin-action-panel">
                            <summary>Quản lý xử lý phần thưởng</summary>
                            <div className="reward-admin-action-content">
                              {canFulfill && <label>Đơn vị vận chuyển<input className="form-input" value={draft.carrier ?? currentCarrier} onChange={(event) => updateFulfillmentDraft(reward.id, 'carrier', event.target.value)} placeholder="Tên đơn vị vận chuyển" /></label>}
                              {canFulfill && <label>Mã vận đơn<input className="form-input" value={draft.trackingNumber ?? currentTracking} onChange={(event) => updateFulfillmentDraft(reward.id, 'trackingNumber', event.target.value)} placeholder="Mã vận đơn" /></label>}
                              <label>Ghi chú của quản trị viên<textarea className="form-input" value={draft.adminNote || ''} onChange={(event) => updateFulfillmentDraft(reward.id, 'adminNote', event.target.value)} maxLength="500" /></label>
                              <div className="workflow-actions">
                                {isGoods && status === 'CLAIMED' && <button type="button" className="btn btn-secondary btn-sm" disabled={Boolean(actionKey)} onClick={() => runFulfillment(reward, 'PROCESS')}>Bắt đầu xử lý</button>}
                                {isGoods && status === 'PROCESSING' && <button type="button" className="btn btn-secondary btn-sm" disabled={Boolean(actionKey) || !(draft.carrier ?? currentCarrier) || !(draft.trackingNumber ?? currentTracking)} onClick={() => runFulfillment(reward, 'SHIP')}><FiTruck /> Đánh dấu đã gửi</button>}
                                {isGoods && status === 'SHIPPED' && <button type="button" className="btn btn-secondary btn-sm" disabled={Boolean(actionKey)} onClick={() => runFulfillment(reward, 'FULFILL')}><FiCheckCircle /> Đánh dấu hoàn thành</button>}
                                {canCancel && <button type="button" className="btn btn-outline btn-sm" disabled={Boolean(actionKey) || !draft.adminNote?.trim()} onClick={() => runFulfillment(reward, 'CANCEL')} title={!draft.adminNote?.trim() ? 'Trước tiên hãy nhập lý do hủy của quản trị viên' : undefined}><FiXCircle /> Hủy</button>}
                              </div>
                            </div>
                          </details>
                        ) : <span className="reward-no-action">{status === 'ISSUED' && !isGoods ? 'Chờ khán giả đổi mã' : status === 'ISSUED' ? 'Chờ khán giả nhận thưởng' : 'Không cần thao tác'}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

function RewardCenterPage() {
  const { user } = useAuth();

  if (user?.role === 'SPECTATOR') return <SpectatorRewardCenter user={user} />;
  if (user?.role === 'ADMIN') return <AdminRewardCenter />;

  return (
    <div className="dashboard-page reward-center-page">
      <div className="reward-access-denied" role="alert">
        <span><FiLock /></span>
        <h1>Quyền truy cập trung tâm phần thưởng bị giới hạn</h1>
        <p>Chỉ tài khoản Khán giả và Quản trị viên mới có thể mở khu vực này.</p>
      </div>
    </div>
  );
}

export default RewardCenterPage;

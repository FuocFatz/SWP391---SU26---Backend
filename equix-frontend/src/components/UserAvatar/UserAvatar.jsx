import { useState } from 'react';
import { resolveAssetUrl } from '../../services/api';
import './UserAvatar.css';

function UserAvatar({ user, className = '', source }) {
  const resolvedSource = resolveAssetUrl(source ?? user?.avatar);
  const [failedSource, setFailedSource] = useState(null);

  const name = user?.name || user?.email || 'User';
  return (
    <div className={className} aria-label={`${name} avatar`}>
      {resolvedSource && failedSource !== resolvedSource ? (
        <img className="user-avatar-image" src={resolvedSource} alt={`${name} avatar`} onError={() => setFailedSource(resolvedSource)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export default UserAvatar;

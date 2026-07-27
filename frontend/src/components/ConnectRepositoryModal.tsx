/* ============================================================
   GitPro — Connect Repository Modal
   ============================================================ */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { GitBranch } from 'lucide-react';
import { useCreateRepository } from '../hooks/useRepositories';

interface ConnectRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectRepositoryModal({ isOpen, onClose }: ConnectRepositoryModalProps) {
  const [cloneUrl, setCloneUrl] = useState('');
  const [error, setError] = useState('');
  const createRepo = useCreateRepository();

  const validateUrl = (url: string) => {
    if (!url) return 'Clone URL is required';
    if (!url.startsWith('https://github.com/')) {
      return 'Only HTTPS GitHub URLs are supported (e.g. https://github.com/owner/repo.git)';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUrl(cloneUrl);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    createRepo.mutate({ cloneUrl }, {
      onSuccess: () => {
        setCloneUrl('');
        setError('');
        onClose();
      },
      onError: (err: any) => {
        setError(err.message || 'Failed to connect repository');
      }
    });
  };

  const handleClose = () => {
    if (!createRepo.isPending) {
      setCloneUrl('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Connect Repository"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <p className="text-muted font-body text-sm">
          GitPro requires HTTPS clone URLs to analyze your repository. The repository must be accessible by your GitHub account.
        </p>

        <Input
          label="GitHub Clone URL"
          placeholder="https://github.com/facebook/react.git"
          value={cloneUrl}
          onChange={(e) => {
            setCloneUrl(e.target.value);
            if (error) setError('');
          }}
          error={error}
          icon={<GitBranch className="w-4 h-4" />}
          disabled={createRepo.isPending}
          autoFocus
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleClose}
            disabled={createRepo.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            isLoading={createRepo.isPending}
          >
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
}

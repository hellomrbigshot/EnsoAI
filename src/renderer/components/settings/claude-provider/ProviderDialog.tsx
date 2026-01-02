import type { ClaudeProvider } from '@shared/types';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';

interface ProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: ClaudeProvider | null;
  initialValues?: Partial<ClaudeProvider> | null;
}

export function ProviderDialog({
  open,
  onOpenChange,
  provider,
  initialValues,
}: ProviderDialogProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const addClaudeProvider = useSettingsStore((s) => s.addClaudeProvider);
  const updateClaudeProvider = useSettingsStore((s) => s.updateClaudeProvider);

  const isEditing = !!provider;

  // 表单状态
  const [name, setName] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [authToken, setAuthToken] = React.useState('');
  const [model, setModel] = React.useState('');
  const [smallFastModel, setSmallFastModel] = React.useState('');
  const [defaultSonnetModel, setDefaultSonnetModel] = React.useState('');
  const [defaultOpusModel, setDefaultOpusModel] = React.useState('');
  const [defaultHaikuModel, setDefaultHaikuModel] = React.useState('');

  // 初始化表单
  React.useEffect(() => {
    if (open) {
      if (provider) {
        setName(provider.name);
        setBaseUrl(provider.baseUrl);
        setAuthToken(provider.authToken);
        setModel(provider.model ?? '');
        setSmallFastModel(provider.smallFastModel ?? '');
        setDefaultSonnetModel(provider.defaultSonnetModel ?? '');
        setDefaultOpusModel(provider.defaultOpusModel ?? '');
        setDefaultHaikuModel(provider.defaultHaikuModel ?? '');
      } else if (initialValues) {
        setName('');
        setBaseUrl(initialValues.baseUrl ?? '');
        setAuthToken(initialValues.authToken ?? '');
        setModel(initialValues.model ?? '');
        setSmallFastModel(initialValues.smallFastModel ?? '');
        setDefaultSonnetModel(initialValues.defaultSonnetModel ?? '');
        setDefaultOpusModel(initialValues.defaultOpusModel ?? '');
        setDefaultHaikuModel(initialValues.defaultHaikuModel ?? '');
      } else {
        setName('');
        setBaseUrl('');
        setAuthToken('');
        setModel('');
        setSmallFastModel('');
        setDefaultSonnetModel('');
        setDefaultOpusModel('');
        setDefaultHaikuModel('');
      }
    }
  }, [open, provider, initialValues]);

  const handleSave = async () => {
    if (!name.trim() || !baseUrl.trim() || !authToken.trim()) {
      return;
    }

    const providerData: ClaudeProvider = {
      id: provider?.id ?? crypto.randomUUID(),
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      authToken: authToken.trim(),
      model: model.trim() || undefined,
      smallFastModel: smallFastModel.trim() || undefined,
      defaultSonnetModel: defaultSonnetModel.trim() || undefined,
      defaultOpusModel: defaultOpusModel.trim() || undefined,
      defaultHaikuModel: defaultHaikuModel.trim() || undefined,
    };

    if (isEditing) {
      updateClaudeProvider(provider.id, providerData);
    } else {
      addClaudeProvider(providerData);
      // 新建后自动应用
      await window.electronAPI.claudeProvider.apply(providerData);
      queryClient.invalidateQueries({ queryKey: ['claude-settings'] });
    }

    onOpenChange(false);
  };

  const isValid = name.trim() && baseUrl.trim() && authToken.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogBackdrop />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('Edit Provider') : t('Add Provider')}</DialogTitle>
          <DialogDescription>{t('Configure Claude API provider settings')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 名称 */}
          <div className="grid gap-2">
            <Label htmlFor="name">{t('Name')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('e.g., Official API')}
            />
          </div>

          {/* Base URL */}
          <div className="grid gap-2">
            <Label htmlFor="baseUrl">{t('Base URL')} *</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.anthropic.com"
            />
          </div>

          {/* Auth Token */}
          <div className="grid gap-2">
            <Label htmlFor="authToken">{t('Auth Token')} *</Label>
            <Input
              id="authToken"
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="sk-ant-..."
            />
          </div>

          {/* 可选字段 - 折叠区域 */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              {t('Advanced Options')}
            </summary>
            <div className="mt-3 grid gap-3">
              {/* Model */}
              <div className="grid gap-2">
                <Label htmlFor="model">{t('Model')}</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="opus / sonnet / haiku"
                />
              </div>

              {/* Small Fast Model */}
              <div className="grid gap-2">
                <Label htmlFor="smallFastModel">{t('Small/Fast Model')}</Label>
                <Input
                  id="smallFastModel"
                  value={smallFastModel}
                  onChange={(e) => setSmallFastModel(e.target.value)}
                  placeholder="claude-3-haiku-..."
                />
              </div>

              {/* Default Sonnet Model */}
              <div className="grid gap-2">
                <Label htmlFor="defaultSonnetModel">{t('Sonnet Model')}</Label>
                <Input
                  id="defaultSonnetModel"
                  value={defaultSonnetModel}
                  onChange={(e) => setDefaultSonnetModel(e.target.value)}
                  placeholder="claude-sonnet-4-..."
                />
              </div>

              {/* Default Opus Model */}
              <div className="grid gap-2">
                <Label htmlFor="defaultOpusModel">{t('Opus Model')}</Label>
                <Input
                  id="defaultOpusModel"
                  value={defaultOpusModel}
                  onChange={(e) => setDefaultOpusModel(e.target.value)}
                  placeholder="claude-opus-4-..."
                />
              </div>

              {/* Default Haiku Model */}
              <div className="grid gap-2">
                <Label htmlFor="defaultHaikuModel">{t('Haiku Model')}</Label>
                <Input
                  id="defaultHaikuModel"
                  value={defaultHaikuModel}
                  onChange={(e) => setDefaultHaikuModel(e.target.value)}
                  placeholder="claude-3-haiku-..."
                />
              </div>
            </div>
          </details>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">{t('Cancel')}</Button>} />
          <Button onClick={handleSave} disabled={!isValid}>
            {isEditing ? t('Save') : t('Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

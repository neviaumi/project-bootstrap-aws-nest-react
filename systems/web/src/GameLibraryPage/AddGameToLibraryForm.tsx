import { gql, useMutation } from '@apollo/client';
import clsx from 'clsx';
import { Button } from '@busybox/react-components/Button';
import { DateInput } from '@busybox/react-components/DateInput';
import { withCheckNewValueIsNotEqual } from '@busybox/react-components/utils/with-check-new-value-is-not-equal';

import { Field } from '@busybox/react-components/FormField/Field';
import { FileUploadInput } from '@busybox/react-components/FileUploadInput';
import { FieldErrorMessage } from '@busybox/react-components/FormField/FieldErrorMessage';
import { Skeleton } from '@busybox/react-components/Skeleton';
import { Image } from '@busybox/react-components/Image';
import { Label } from '@busybox/react-components/FormField/Label';
import {
  Modal,
  ModalContent,
  ModalTitle,
} from '@busybox/react-components/Modal';
import { NumberInput } from '@busybox/react-components/NumberInput';
import { Select, SelectOption } from '@busybox/react-components/Select';
import { TextInput } from '@busybox/react-components/TextInput';
import {
  type ChangeEvent,
  type PropsWithoutRef,
  type PropsWithChildren,
  type ReactElement,
  useState,
} from 'react';
import {
  type Control,
  Controller,
  useController,
  useForm,
  FormProvider,
} from 'react-hook-form';

type AddGameToLibraryFormValues = {
  boxArtImageUrl: string;
  genre: string;
  name: string;
  numberOfPlayers: string;
  platform: string;
  publisher: string;
  releaseDate: string | null;
};

function FieldWithLoading({
  children,
  skeleton,
  loading,
}: PropsWithChildren<{
  skeleton: ReactElement;
  loading: boolean;
}>) {
  if (loading) return skeleton;
  return children;
}

export function GameBoxArtUploadField({
  control,
}: PropsWithoutRef<{
  control: Control<AddGameToLibraryFormValues>;
}>) {
  const PREPARE_UPLOAD_GAME_BOX_ART = gql`
    mutation uploadBoxArt($fileName: String!) {
      prepareUploadGameBoxArt(fileName: $fileName) {
        id
        resultPublicUrl
        uploadUrl
      }
    }
  `;
  const [
    prePareUploadGameBoxArt,
    { loading: prePareUploadGameBoxArtMutationLoading },
  ] = useMutation(PREPARE_UPLOAD_GAME_BOX_ART);
  const { field, fieldState, formState } = useController({
    control: control,
    name: 'boxArtImageUrl',
    rules: {
      required: 'box art must be provided',
    },
  });
  const { disabled, name, onBlur, onChange, ref, value } = field;
  const { invalid, isDirty, error } = fieldState;
  const { isSubmitted, isSubmitting } = formState;
  const shouldConsiderInvalidAsError = isSubmitted || isDirty;

  const uploadFileWhenInputChanged = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const [sourceFile]: FileList | Array<null> = event.target.files ?? [];
    if (!sourceFile) return;
    const { data, errors } = await prePareUploadGameBoxArt({
      variables: { fileName: sourceFile.name },
    });
    if (errors) return;
    await fetch(data.prepareUploadGameBoxArt.uploadUrl, {
      body: sourceFile,
      method: 'PUT',
    });
    onChange(data.prepareUploadGameBoxArt.resultPublicUrl);
  };
  return (
    <Field
      disabled={disabled}
      error={invalid}
      name={name}
      onBlur={onBlur}
      required
      className={'tw-flex tw-flex-col tw-justify-center tw-gap-0.5'}
      onChange={uploadFileWhenInputChanged}
      value={value}
    >
      <FieldWithLoading
        skeleton={<Skeleton className={'tw-h-5 tw-w-full'} />}
        loading={isSubmitting || prePareUploadGameBoxArtMutationLoading}
      >
        {value && (
          <div className={'tw-flex tw-justify-center'}>
            <Image
              className="tw-w-full"
              data-testid="uploaded-image"
              alt={`${name}Value`}
              src={value}
            />
          </div>
        )}

        <FileUploadInput
          className={clsx(
            'tw-items-center tw-justify-center',
            shouldConsiderInvalidAsError
              ? 'group-invalid:tw-border-error group-invalid:tw-bg-error group-invalid:tw-text-error'
              : 'group-invalid:tw-border-warning group-invalid:tw-bg-white group-invalid:tw-text-warning',
            'group-invalid:hover:tw-border-primary-user-action group-invalid:hover:tw-bg-primary-user-action group-invalid:hover:tw-text-primary-user-action',
          )}
          data-testid={'game-box-art-file-upload'}
          ref={ref}
        >
          Upload Box Art{value && ' Again'}
        </FileUploadInput>
      </FieldWithLoading>
      <FieldErrorMessage className={'tw-text-error'}>
        {error?.message}
      </FieldErrorMessage>
    </Field>
  );
}

function AddGameToLibraryModal({
  onModalClose,
  open,
}: {
  onModalClose?: (e: any, reason: string) => void;
  open: boolean;
}) {
  const ADD_GAME_TO_LIST = gql`
    mutation addGameToLibrary($data: AddGameToLibraryArgs!) {
      addGameToLibrary(data: $data) {
        id
      }
    }
  `;
  const [createGameMutation] = useMutation(ADD_GAME_TO_LIST);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AddGameToLibraryFormValues>({
    defaultValues: {
      name: '',
      publisher: '',
    },
    shouldUseNativeValidation: true,
    mode: 'onChange',
  });
  const submitFormValues = async (values: AddGameToLibraryFormValues) => {
    const data = {
      ...values,
      // Hardcoded user id for easily isolate records in DB
      userId: '1ec57d7a-67be-42d0-8a97-07e743e6efbc',
    };
    try {
      await createGameMutation({
        variables: {
          data,
        },
      });
    } catch (e) {
      return;
    }
    onModalClose?.(
      new CustomEvent('gameCreatedInLibrary', {
        detail: {
          gameCreated: data,
        },
      }),
      'submit',
    );
  };
  return (
    <Modal
      data-testid={'add-game-to-library-modal'}
      onClose={onModalClose}
      open={open}
    >
      <ModalTitle>Add game to your library</ModalTitle>
      <ModalContent className={'tw-w-full'}>
        <form
          noValidate
          className={'tw-flex tw-flex-col tw-justify-start tw-w-full'}
          onSubmit={handleSubmit(submitFormValues)}
        >
          <GameBoxArtUploadField control={control} />
          <Controller
            control={control}
            name={'name'}
            rules={{
              required: 'name must be provided',
            }}
            render={({ field, fieldState, formState }) => {
              const { disabled, name, onBlur, onChange, ref, value } = field;
              const { invalid, isDirty, error } = fieldState;
              const { isSubmitted } = formState;
              const shouldConsiderInvalidAsError = isSubmitted || isDirty;
              return (
                <Field
                  disabled={disabled}
                  error={invalid}
                  name={name}
                  onBlur={onBlur}
                  onChange={onChange}
                  value={value}
                  required
                  className={'tw-flex tw-flex-col tw-gap-0.5'}
                >
                  <Label
                    className={clsx(
                      shouldConsiderInvalidAsError
                        ? 'group-invalid:tw-text-error'
                        : 'group-invalid:tw-text-warning',
                      'after:tw-content-["_*"]',
                    )}
                  >
                    Name
                  </Label>
                  <FieldWithLoading
                    skeleton={<Skeleton className={'tw-h-5 tw-w-full'} />}
                    loading={isSubmitting}
                  >
                    <TextInput
                      ref={ref}
                      data-testid={'game-name-input'}
                      slotProps={{
                        input: {
                          className: shouldConsiderInvalidAsError
                            ? 'invalid:tw-border-error'
                            : 'invalid:tw-border-warning',
                          placeholder: 'Enter game name',
                        },
                      }}
                    />
                  </FieldWithLoading>
                  <FieldErrorMessage className={'tw-text-error'}>
                    {error?.message}
                  </FieldErrorMessage>
                </Field>
              );
            }}
          />
          <Controller
            control={control}
            name={'publisher'}
            rules={{
              required: 'publisher must be provided',
            }}
            render={({ field, fieldState, formState }) => {
              const { disabled, name, onBlur, onChange, ref, value } = field;
              const { invalid, isDirty, error } = fieldState;
              const { isSubmitted } = formState;
              const shouldConsiderInvalidAsError = isSubmitted || isDirty;
              return (
                <Field
                  disabled={disabled}
                  error={invalid}
                  name={name}
                  onBlur={onBlur}
                  onChange={onChange}
                  value={value}
                  required
                  className={'tw-flex tw-flex-col tw-gap-0.5'}
                >
                  <Label
                    className={clsx(
                      shouldConsiderInvalidAsError
                        ? 'group-invalid:tw-text-error'
                        : 'group-invalid:tw-text-warning',
                      'after:tw-content-["_*"]',
                    )}
                  >
                    Publisher
                  </Label>
                  <FieldWithLoading
                    skeleton={<Skeleton className={'tw-h-5 tw-w-full'} />}
                    loading={isSubmitting}
                  >
                    <TextInput
                      ref={ref}
                      data-testid={'game-publisher-input'}
                      slotProps={{
                        input: {
                          className: shouldConsiderInvalidAsError
                            ? 'invalid:tw-border-error'
                            : 'invalid:tw-border-warning',
                          placeholder: 'Enter publisher of game',
                        },
                      }}
                    />
                  </FieldWithLoading>
                  <FieldErrorMessage className={'tw-text-error'}>
                    {error?.message}
                  </FieldErrorMessage>
                </Field>
              );
            }}
          />
          <Controller
            control={control}
            name={'platform'}
            rules={{
              required: 'platform must be provided',
            }}
            render={({ field, fieldState, formState }) => {
              const { disabled, name, onBlur, onChange, ref, value } = field;
              const { invalid, isDirty, error } = fieldState;
              const { isSubmitted } = formState;
              const shouldShowAsError = isSubmitted || isDirty;
              return (
                <Field
                  disabled={disabled}
                  error={invalid}
                  name={name}
                  onBlur={onBlur}
                  onChange={withCheckNewValueIsNotEqual(value)(onChange)}
                  value={value}
                  required
                  className={'tw-flex tw-flex-col tw-gap-0.5'}
                >
                  <Label
                    className={clsx(
                      shouldShowAsError
                        ? 'group-invalid:tw-text-error'
                        : 'group-invalid:tw-text-warning',
                      'after:tw-content-["_*"]',
                    )}
                  >
                    Platform
                  </Label>

                  <FieldWithLoading
                    skeleton={<Skeleton className={'tw-h-5 tw-w-full'} />}
                    loading={isSubmitting}
                  >
                    <Select
                      placeholder={'Select platform'}
                      data-testid={'game-platform-input'}
                      slotProps={{
                        listbox: {
                          className: 'tw-w-60 tw-bg-white',
                          'data-testid': 'form-stories-select-options',
                        },
                        root: {
                          className: clsx(
                            'tw-h-5 tw-w-full tw-text-left',
                            shouldShowAsError
                              ? 'group-invalid:tw-border-error group-invalid:tw-text-error'
                              : 'group-invalid:tw-border-warning group-invalid:tw-text-gray-500',
                          ),
                        },
                      }}
                      ref={ref}
                    >
                      <SelectOption
                        data-testid={'game-platform-input-ps4'}
                        value={'PS4'}
                      >
                        PS4
                      </SelectOption>
                      <SelectOption
                        data-testid={'game-platform-input-ps5'}
                        value={'PS5'}
                      >
                        PS5
                      </SelectOption>
                    </Select>
                  </FieldWithLoading>
                  <FieldErrorMessage className={'tw-text-error'}>
                    {error?.message}
                  </FieldErrorMessage>
                </Field>
              );
            }}
          />
          <Controller
            control={control}
            name={'numberOfPlayers'}
            rules={{
              required: 'number of player be provided',
              validate: (value: string) => {
                if (isNaN(parseInt(value, 10))) {
                  return 'number of player must be a number';
                }
                return true;
              },
            }}
            render={({ field, fieldState, formState }) => {
              const { disabled, name, onBlur, onChange, ref, value } = field;
              const { invalid, isDirty, error } = fieldState;
              const { isSubmitted } = formState;
              const shouldConsiderInvalidAsError = isSubmitted || isDirty;

              return (
                <Field
                  disabled={disabled}
                  error={invalid}
                  name={name}
                  onBlur={onBlur}
                  value={value}
                  required
                  className={'tw-flex tw-flex-col tw-gap-0.5'}
                  onChange={e => onChange(parseInt(e.target.value, 10))}
                >
                  <Label
                    className={clsx(
                      shouldConsiderInvalidAsError
                        ? 'group-invalid:tw-text-error'
                        : 'group-invalid:tw-text-warning',
                      'after:tw-content-["_*"]',
                    )}
                  >
                    Number of Players
                  </Label>
                  <FieldWithLoading
                    skeleton={<Skeleton className={'tw-h-5 tw-w-full'} />}
                    loading={isSubmitting}
                  >
                    <NumberInput
                      data-testid={'game-number-of-players-input'}
                      ref={ref}
                      placeholder={'Enter number of players'}
                      slotProps={{
                        input: {
                          min: 1,
                          className: shouldConsiderInvalidAsError
                            ? 'invalid:tw-border-error'
                            : 'invalid:tw-border-warning',
                        },
                      }}
                    />
                  </FieldWithLoading>
                  <FieldErrorMessage className={'tw-text-error'}>
                    {error?.message}
                  </FieldErrorMessage>
                </Field>
              );
            }}
          />
          <Controller
            control={control}
            name={'genre'}
            rules={{
              required: 'genre must be provided',
            }}
            render={({ field, fieldState, formState }) => {
              const { disabled, name, onBlur, onChange, ref, value } = field;
              const { invalid, isDirty, error } = fieldState;
              const { isSubmitted } = formState;
              const shouldConsiderInvalidAsError = isSubmitted || isDirty;

              return (
                <Field
                  disabled={disabled}
                  name={name}
                  onBlur={onBlur}
                  onChange={withCheckNewValueIsNotEqual(value)(onChange)}
                  value={value}
                  required
                  error={invalid}
                  className={'tw-flex tw-flex-col tw-gap-0.5'}
                >
                  <Label
                    className={clsx(
                      shouldConsiderInvalidAsError
                        ? 'group-invalid:tw-text-error'
                        : 'group-invalid:tw-text-warning',
                      'after:tw-content-["_*"]',
                    )}
                  >
                    Genre
                  </Label>
                  <FieldWithLoading
                    skeleton={<Skeleton className={'tw-h-5 tw-w-full'} />}
                    loading={isSubmitting}
                  >
                    <Select
                      ref={ref}
                      data-testid={'game-genre-input'}
                      placeholder={'Select genre'}
                      slotProps={{
                        listbox: {
                          className: 'tw-w-60 tw-bg-white',
                          'data-testid': 'form-stories-select-options',
                        },
                        root: {
                          className: clsx(
                            'tw-h-5 tw-w-full tw-text-left',
                            shouldConsiderInvalidAsError
                              ? 'group-invalid:tw-border-error group-invalid:tw-text-error'
                              : 'group-invalid:tw-border-warning group-invalid:tw-text-gray-500',
                          ),
                        },
                      }}
                    >
                      <SelectOption
                        data-testid={'game-genre-input-fighting'}
                        value={'FIGHTING'}
                      >
                        Fighting
                      </SelectOption>
                      <SelectOption
                        data-testid={'game-genre-input-fps'}
                        value={'FPS'}
                      >
                        FPS
                      </SelectOption>
                      <SelectOption
                        data-testid={'game-genre-input-rpg'}
                        value={'RPG'}
                      >
                        RPG
                      </SelectOption>
                      <SelectOption
                        data-testid={'game-genre-input-srpg'}
                        value={'SRPG'}
                      >
                        SRPG
                      </SelectOption>
                      <SelectOption
                        data-testid={'game-genre-input-action'}
                        value={'ACTION'}
                      >
                        ACTION
                      </SelectOption>
                    </Select>
                  </FieldWithLoading>
                  <FieldErrorMessage className={'tw-text-error'}>
                    {error?.message}
                  </FieldErrorMessage>
                </Field>
              );
            }}
          />
          <Controller
            control={control}
            name={'releaseDate'}
            rules={{
              required: 'release date must be provided',
            }}
            render={({ field, fieldState, formState }) => {
              const { disabled, name, onBlur, onChange, ref, value } = field;
              const { invalid, isDirty, error } = fieldState;
              const { isSubmitted } = formState;
              const shouldConsiderInvalidAsError = isSubmitted || isDirty;
              return (
                <Field
                  disabled={disabled}
                  error={invalid}
                  name={name}
                  onBlur={onBlur}
                  value={value}
                  required
                  onChange={onChange}
                  className={'tw-flex tw-flex-col tw-gap-0.5'}
                >
                  <Label
                    className={clsx(
                      shouldConsiderInvalidAsError
                        ? 'group-invalid:tw-text-error'
                        : 'group-invalid:tw-text-warning',
                      'after:tw-content-["_*"]',
                    )}
                  >
                    Release Date
                  </Label>
                  <FieldWithLoading
                    skeleton={<Skeleton className={'tw-h-5 tw-w-full'} />}
                    loading={isSubmitting}
                  >
                    <DateInput
                      data-testid={'game-release-date-input'}
                      slotProps={{
                        input: {
                          className: clsx(
                            shouldConsiderInvalidAsError
                              ? 'invalid:tw-border-error invalid:tw-text-error'
                              : 'invalid:tw-border-warning invalid:tw-text-gray-500',
                          ),
                        },
                      }}
                      ref={ref}
                    />
                  </FieldWithLoading>
                  <FieldErrorMessage className={'tw-text-error'}>
                    {error?.message}
                  </FieldErrorMessage>
                </Field>
              );
            }}
          />
          <footer className={'tw-mb-1 tw-mt-2 tw-flex tw-justify-end tw-gap-2'}>
            <Button data-testid={'game-submit'} type={'submit'}>
              Submit
            </Button>
            <Button
              data-testid={'cancel-game-submit'}
              onClick={e => {
                onModalClose?.(e, 'cancel');
              }}
            >
              Cancel
            </Button>
          </footer>
        </form>
      </ModalContent>
    </Modal>
  );
}
function isSubmitEvent(
  _e: unknown,
  reason: string,
): _e is CustomEvent<{ gameCreated: AddGameToLibraryFormValues }> {
  return reason === 'submit';
}

function AddGameToLibraryModalTrigger({
  onGameCreatedOnLibrary,
}: {
  onGameCreatedOnLibrary: (data: AddGameToLibraryFormValues) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const onModalClose = (e: Event, reason: 'submit' | 'cancel' | string) => {
    setModalOpen(false);
    if (isSubmitEvent(e, reason)) {
      onGameCreatedOnLibrary(e.detail.gameCreated);
    }
  };
  return (
    <>
      <Button
        data-testid={'add-game-to-library'}
        onClick={() => setModalOpen(true)}
      >
        Add Game to Library
      </Button>
      {modalOpen && (
        <AddGameToLibraryModal onModalClose={onModalClose} open={modalOpen} />
      )}
    </>
  );
}

export default AddGameToLibraryModalTrigger;

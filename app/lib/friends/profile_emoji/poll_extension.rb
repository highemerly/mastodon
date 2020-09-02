module Friends
  module ProfileEmoji
    module PollExtension
      extend ActiveSupport::Concern

      def profile_emojis
        @profile_emojis ||= Friends::ProfileEmoji::Emoji.from_text(options.join(' '), account.domain)
      end
    end
  end
end

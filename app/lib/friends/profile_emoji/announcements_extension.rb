module Friends
  module ProfileEmoji
    module AnnouncementsExtension
      extend ActiveSupport::Concern

      def profile_emojis
        return @profile_emojis if defined?(@profile_emojis)

        @profile_emojis = Friends::ProfileEmoji::Emoji.from_text(text, nil)
      end
    end
  end
end
